package at.htl.media;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import at.htl.party.Party;
import at.htl.party.PartyRepository;
import at.htl.user.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class MediaRepository {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    @Inject
    EntityManager entityManager;
    @Inject
    PartyRepository partyRepository;
    @Inject
    UserRepository userRepository;
    @Inject
    Logger logger;

    final Long DEFAULT_USER_ID = 1L;

    public List<MediaDto> getImages(long partyId) {
        boolean access = !entityManager.createQuery(
                        "SELECT p.id " +
                                "FROM Party p " +
                                "LEFT JOIN p.users u " +
                                "WHERE p.id = :partyId " +
                                "AND ( p.host_user.id = :userId " +
                                "      OR u.id = :userId )",
                        Long.class)
                .setParameter("partyId", partyId)
                .setParameter("userId", DEFAULT_USER_ID)
                .getResultList()
                .isEmpty();
        List<MediaDto> result = new java.util.ArrayList<>();
        if (access) {
            List<Media> mediaList = entityManager.createQuery("SELECT m FROM Media m WHERE m.party.id=:partyId", Media.class).setParameter("partyId", partyId).getResultList();
            result = mediaList.stream().map(this::toMediaDto).collect(Collectors.toList());
        }
        return result;
    }

    public Response getMediaById(long id) {
        Media media = entityManager.find(Media.class, id);

        if (media == null) {
            logger.warn("Media not found with id: " + id);
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        String url = media.getFile();
        String resourcePath = "uploads/" + url;

        InputStream is = Thread.currentThread()
                .getContextClassLoader()
                .getResourceAsStream(resourcePath);

        if (is == null) {
            logger.error("File not found at resource path: " + resourcePath);
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("Resource not found: " + resourcePath)
                    .type("text/plain")
                    .build();
        }

        String type = "image/jpeg";
        String lower = url.toLowerCase();
        if (lower.endsWith(".png"))  type = "image/png";
        else if (lower.endsWith(".gif"))  type = "image/gif";
        else if (lower.endsWith(".webp")) type = "image/webp";

        return Response.ok(is, type).build();
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
        logger.log(Logger.Level.DEBUG, "Upload request for party: " + partyId + ", user: " + userId);

        Party party = partyRepository.getPartyById(partyId);
        if (party == null) {
            logger.log(Logger.Level.WARN, "Party not found with id: " + partyId);
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Party not found\"}")
                    .build();
        }

        if (input == null || input.file == null || input.file.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"No file provided\"}")
                    .build();
        }

        String uploadDir = "src/main/resources/uploads/party" + partyId + "/";
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            logger.log(Logger.Level.ERROR, "Failed to create upload directory: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Failed to create upload directory\"}")
                    .build();
        }

        for (FileUpload file : input.file) {
            String contentType = file.contentType();
            if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
                logger.log(Logger.Level.WARN, "Invalid content type: " + contentType);
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity("{\"error\": \"Only image files (JPEG, PNG, GIF, WebP) are allowed\"}")
                        .build();
            }

            if (file.size() > MAX_FILE_SIZE) {
                logger.log(Logger.Level.WARN, "File too large: " + file.size() + " bytes");
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity("{\"error\": \"File size must be less than 5MB\"}")
                        .build();
            }

            String sanitizedFilename = sanitizeFilename(file.fileName());
            String timestampedFilename = Instant.now().toString() + "_" + sanitizedFilename;
            String relativePath = "party" + partyId + "/" + timestampedFilename;
            Media media = new Media(party, userRepository.getUser(userId), relativePath);
            entityManager.persist(media);
            java.nio.file.Path uploadedFile = file.uploadedFile();
            java.nio.file.Path targetLocation = Paths.get(uploadDir, timestampedFilename);
            try {
                Files.move(uploadedFile, targetLocation);
                logger.log(Logger.Level.INFO, "File saved to: " + targetLocation);
            } catch (IOException e) {
                logger.log(Logger.Level.ERROR, "Failed to save file: " + e.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity("{\"error\": \"Failed to save file\"}")
                        .build();
            }
        }
        return Response.ok().build();
    }

    private String sanitizeFilename(String filename) {
        String sanitized = filename.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (sanitized.length() > 100) {
            String extension = "";
            int dotIndex = sanitized.lastIndexOf('.');
            if (dotIndex > 0) {
                extension = sanitized.substring(dotIndex);
                sanitized = sanitized.substring(0, dotIndex);
            }
            sanitized = sanitized.substring(0, 100 - extension.length()) + extension;
        }
        return sanitized;
    }

    public static class FileUploadInput {
        @FormParam("file")
        public List<FileUpload> file;
    }

    private MediaDto toMediaDto(Media media) {
        return new MediaDto(
                media.getId(),
                media.getParty().getId(),
                media.getUrl()
        );
    }

    public Response getImgByMediaId(long id) {
    Media media = entityManager.find(Media.class, id);

    if (media == null) {
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    String url = media.getUrl();
    java.nio.file.Path filePath = Paths.get("src/main/resources/uploads", url);

    if (!Files.exists(filePath)) {
        logger.error("Datei nicht gefunden: " + filePath.toAbsolutePath());
        return Response.status(Response.Status.NOT_FOUND)
                .entity("Resource nicht gefunden: " + filePath)
                .type("text/plain")
                .build();
    }

    try {
        InputStream is = Files.newInputStream(filePath);
        String type = "image/jpeg";
        String lower = url.toLowerCase();
        if (lower.endsWith(".png"))  type = "image/png";
        else if (lower.endsWith(".gif"))  type = "image/gif";
        else if (lower.endsWith(".webp")) type = "image/webp";
        return Response.ok(is, type).build();
    } catch (IOException e) {
        logger.error("Failed to read file: " + e.getMessage());
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
    }
}
}