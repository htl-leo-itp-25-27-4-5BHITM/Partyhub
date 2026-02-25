package at.htl.media;

import at.htl.party.PartyRepository;
import at.htl.user.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class MediaRepository {

    @Inject
    EntityManager entityManager;
    @Inject
    PartyRepository partyRepository;
    @Inject
    UserRepository userRepository;
    @Inject
    Logger logger;

//    // TODO: Use current user
//    final Long DEFAULT_USER_ID = 1L;
//
//    public List<MediaDto> getImages(long partyId) {
//        boolean access = !entityManager.createQuery(
//                        "SELECT p.id " +
//                                "FROM Party p " +
//                                "LEFT JOIN p.users u " +
//                                "WHERE p.id = :partyId " +
//                                "AND ( p.host_user.id = :userId " +
//                                "      OR u.id = :userId )",
//                        Long.class)
//                .setParameter("partyId", partyId)
//                .setParameter("userId", DEFAULT_USER_ID)
//                .getResultList()
//                .isEmpty();
//        List<MediaDto> result = new ArrayList<>();
//        if (access) {
//            List<Media> mediaList = entityManager.createQuery("SELECT m FROM Media m WHERE m.party.id=:partyId", Media.class).setParameter("partyId", partyId).getResultList();
//            result = mediaList.stream().map(this::toMediaDto).collect(Collectors.toList());
//        }
//        return result;
//    }

    public Response getMediaById(long id) {
        Media media = entityManager.find(Media.class, id);
        try {
            String mediaName = media.getFile();
            String path = "src/main/resources/uploads/" + media.getParty().getId() + "/" + mediaName;
            InputStream is = Files.newInputStream(Paths.get(path));
            String type = "application/octet-stream";
            if (mediaName.endsWith(".jpg") || mediaName.endsWith(".jpeg")) type = "image/jpeg";
            else if (mediaName.endsWith(".png")) type = "image/png";
            else if (mediaName.endsWith(".gif")) type = "image/gif";
            return Response.ok(is, type).build();
        } catch (IOException e) {
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    public List<MediaDto> getMediaByUser(Long userId) {
        List<Media> mediaList = entityManager.createQuery(
                "SELECT m FROM Media m WHERE m.user.id = :userId",
                Media.class)
                .setParameter("userId", userId)
                .getResultList();
        return mediaList.stream().map(this::toMediaDto).collect(Collectors.toList());
    }

    public List<MediaDto> getMediaByParty(Long partyId) {
        List<Media> mediaList = entityManager.createQuery(
                        "SELECT m FROM Media m WHERE m.party.id = :partyId",
                        Media.class)
                .setParameter("partyId", partyId)
                .getResultList();
        return mediaList.stream().map(this::toMediaDto).collect(Collectors.toList());
    }

    public Response upload(FileUploadInput input, long partyId, long userId) {
        // TODO: Sanitize uploads
        logger.log(Logger.Level.DEBUG, "upload");
        String uploadDir = "src/main/resources/uploads/" + partyId + "/";
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        for (FileUpload file : input.file) {
            String timestampedFilename = Instant.now().toString() + "_" + file.fileName();
            String relativePath = "party" + partyId + "/" + timestampedFilename;
            Media media = new Media(partyRepository.getPartyById(partyId), userRepository.getUser(userId), relativePath);
            entityManager.persist(media);
            java.nio.file.Path uploadedFile = file.uploadedFile();
            java.nio.file.Path targetLocation = Paths.get(uploadDir, timestampedFilename);
            try {
                Files.move(uploadedFile, targetLocation);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
            logger.log(Logger.Level.INFO, "File saved to: " + targetLocation);
        }
        return Response.ok().build();
    }

    public static class FileUploadInput {
        @FormParam("file")
        public List<FileUpload> file;
    }

    private MediaDto toMediaDto(Media media) {
        return new MediaDto(
                media.getId()
        );
    }
}
