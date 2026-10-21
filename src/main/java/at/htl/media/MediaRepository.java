package at.htl.media;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import at.htl.party.Party;
import at.htl.party.PartyRepository;
import at.htl.user.User;
import at.htl.user.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Status;
import jakarta.transaction.Synchronization;
import jakarta.transaction.TransactionSynchronizationRegistry;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class MediaRepository {

    static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MiB

    // Mirrors PartyRepository.getPartyByIdIfVisible: public, host, pending invitee or joined attendee.
    // :callerId is -1 for anonymous callers, which matches no user.
    private static final String VISIBLE_PARTY_PREDICATE =
            "(UPPER(p.visibility) = 'PUBLIC'" +
            " OR p.host_user.id = :callerId" +
            " OR EXISTS (SELECT i.id FROM Invitation i WHERE i.party = p AND i.status = 'PENDING' AND i.recipient.id = :callerId)" +
            " OR EXISTS (SELECT u.id FROM Party p2 JOIN p2.users u WHERE p2 = p AND u.id = :callerId))";

    @Inject
    EntityManager entityManager;
    @Inject
    PartyRepository partyRepository;
    @Inject
    UserRepository userRepository;
    @Inject
    Logger logger;
    @Inject
    TransactionSynchronizationRegistry transactionRegistry;

    @ConfigProperty(name = "partyhub.media.upload-dir", defaultValue = "uploads/media")
    String uploadDir;

    public record StoredImage(Path path, ImageType type) {
    }

    private record AcceptedUpload(FileUpload file, ImageType type) {
    }

    /** All items of a party; the caller (null = anonymous) only decides each item's canDelete flag. */
    public List<MediaDto> getMediaByParty(Long partyId, Long callerId) {
        return entityManager.createQuery(
                        "SELECT m FROM Media m WHERE m.party.id = :partyId ORDER BY m.id",
                        Media.class)
                .setParameter("partyId", partyId)
                .getResultStream()
                .map(media -> toMediaDto(media, callerId))
                .toList();
    }

    public List<MediaDto> getVisibleMediaByUser(Long userId, Long callerId) {
        return entityManager.createQuery(
                        "SELECT m FROM Media m JOIN m.party p WHERE m.user.id = :userId AND "
                                + VISIBLE_PARTY_PREDICATE + " ORDER BY m.id",
                        Media.class)
                .setParameter("userId", userId)
                .setParameter("callerId", callerId == null ? -1L : callerId)
                .getResultStream()
                .map(media -> toMediaDto(media, callerId))
                .toList();
    }

    /** The media item, if it exists and its party is visible to the caller (null = anonymous). */
    public Optional<Media> findVisibleMedia(long mediaId, Long callerId) {
        return entityManager.createQuery(
                        "SELECT m FROM Media m JOIN m.party p WHERE m.id = :mediaId AND " + VISIBLE_PARTY_PREDICATE,
                        Media.class)
                .setParameter("mediaId", mediaId)
                .setParameter("callerId", callerId == null ? -1L : callerId)
                .getResultStream()
                .findFirst();
    }

    /** The uploader and the party host may delete an item; anonymous callers never. */
    public boolean canDelete(Media media, Long callerId) {
        if (callerId == null) {
            return false;
        }
        User uploader = media.getUser();
        User host = media.getParty().getHost_user();
        return (uploader != null && callerId.equals(uploader.getId()))
                || (host != null && callerId.equals(host.getId()));
    }

    /**
     * Deletes a gallery item for its uploader or the party host. Items the caller cannot view are
     * reported as 404 so the response does not reveal private media. The row is removed inside the
     * caller's transaction and the file only after commit, so a rollback never leaves a listed item
     * without its image. Must run inside a transaction.
     */
    public Response delete(long mediaId, long callerId) {
        Optional<Media> found = findVisibleMedia(mediaId, callerId);
        if (found.isEmpty()) {
            return error(Response.Status.NOT_FOUND, "Media not found");
        }
        Media media = found.get();
        if (!canDelete(media, callerId)) {
            return error(Response.Status.FORBIDDEN, "Only the uploader or the party host can delete this photo");
        }

        Optional<Path> file = storedFilePath(media);
        // Party.media cascades ALL and is loaded eagerly; without this the flush would re-persist the item
        media.getParty().getMedia().remove(media);
        entityManager.remove(media);
        entityManager.flush();
        file.ifPresent(path -> transactionRegistry.registerInterposedSynchronization(new Synchronization() {
            @Override
            public void beforeCompletion() {
            }

            @Override
            public void afterCompletion(int status) {
                if (status == Status.STATUS_COMMITTED) {
                    deleteQuietly(List.of(path));
                }
            }
        }));
        logger.infof("Deleted gallery media %d by user %d", mediaId, callerId);
        return Response.noContent().build();
    }

    /** The stored image behind a media item, if the file exists inside the upload directory and is a valid image. */
    public Optional<StoredImage> resolveStoredImage(Media media) {
        Optional<Path> stored = storedFilePath(media);
        if (stored.isEmpty() || !Files.isRegularFile(stored.get())) {
            logger.warnf("Backing image for media %d is unavailable", media.getId());
            return Optional.empty();
        }
        Path path = stored.get();
        try {
            return ImageType.detect(path).map(type -> new StoredImage(path, type));
        } catch (IOException e) {
            logger.errorf("Failed to read backing image for media %d: %s", media.getId(), e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Validates every file before any side effect, moves the files into the party's upload
     * directory under server-generated names, and only then persists the media rows.
     * Must run inside a transaction; a persistence failure removes the moved files and rethrows.
     */
    public Response upload(FileUploadInput input, long partyId, long userId) {
        Party party = partyRepository.getPartyByIdIfVisible(partyId, userId);
        if (party == null) {
            return error(Response.Status.NOT_FOUND, "Party not found");
        }
        User user = userRepository.getUser(userId);

        List<AcceptedUpload> accepted = new ArrayList<>();
        for (FileUpload file : input.file) {
            if (file == null || file.uploadedFile() == null || file.size() == 0) {
                return error(Response.Status.BAD_REQUEST, "Empty files are not allowed");
            }
            if (file.size() > MAX_FILE_SIZE) {
                return error(Response.Status.BAD_REQUEST, "File size must be at most 5 MiB");
            }
            Optional<ImageType> type;
            try {
                type = ImageType.detect(file.uploadedFile());
            } catch (IOException e) {
                logger.errorf("Failed to read uploaded file: %s", e.getMessage());
                return error(Response.Status.BAD_REQUEST, "Uploaded file could not be read");
            }
            if (type.isEmpty()) {
                return error(Response.Status.BAD_REQUEST, "Only image files (JPEG, PNG, GIF, WebP) are allowed");
            }
            accepted.add(new AcceptedUpload(file, type.get()));
        }

        String partyDir = "party" + party.getId();
        Path targetDir = Paths.get(uploadDir, partyDir);
        List<Path> moved = new ArrayList<>();
        List<Media> created = new ArrayList<>();
        try {
            Files.createDirectories(targetDir);
            for (AcceptedUpload upload : accepted) {
                String fileName = UUID.randomUUID() + "." + upload.type().extension();
                Path target = targetDir.resolve(fileName);
                Files.move(upload.file().uploadedFile(), target);
                moved.add(target);
                created.add(new Media(party, user, partyDir + "/" + fileName));
            }
        } catch (IOException e) {
            logger.errorf("Failed to store gallery upload for party %d: %s", partyId, e.getMessage());
            deleteQuietly(moved);
            return error(Response.Status.INTERNAL_SERVER_ERROR, "Failed to store the uploaded image");
        }

        try {
            created.forEach(entityManager::persist);
            entityManager.flush();
        } catch (RuntimeException e) {
            deleteQuietly(moved);
            throw e;
        }
        logger.infof("Stored %d gallery image(s) for party %d", created.size(), partyId);
        return Response.ok(created.stream().map(media -> toMediaDto(media, userId)).toList()).build();
    }

    /** The media's file path, if its stored reference stays inside the upload directory. */
    private Optional<Path> storedFilePath(Media media) {
        Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path path = base.resolve(media.getFile()).normalize();
        return path.startsWith(base) ? Optional.of(path) : Optional.empty();
    }

    private void deleteQuietly(List<Path> files) {
        for (Path file : files) {
            try {
                Files.deleteIfExists(file);
            } catch (IOException e) {
                logger.warnf("Could not remove %s: %s", file, e.getMessage());
            }
        }
    }

    private Response error(Response.Status status, String message) {
        return Response.status(status).entity(Map.of("error", message)).build();
    }

    private MediaDto toMediaDto(Media media, Long callerId) {
        return new MediaDto(media.getId(), media.getParty().getId(), canDelete(media, callerId));
    }
}
