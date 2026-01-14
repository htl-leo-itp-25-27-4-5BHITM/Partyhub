package at.htl.repository;

import at.htl.dto.MediaDto;
import at.htl.model.Media;
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
import java.util.ArrayList;
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

    // TODO: Use current user
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
        List<MediaDto> result = new ArrayList<>();
        if (access) {
            List<Media> mediaList = entityManager.createQuery("SELECT m FROM Media m WHERE m.party.id=:partyId", Media.class).setParameter("partyId", partyId).getResultList();
            result = mediaList.stream().map(this::toMediaDto).collect(Collectors.toList());
        }
        return result;
    }

    public Response upload(FileUploadInput input, long partyId) {
        // TODO: Sanitize uploads
        logger.log(Logger.Level.DEBUG, "upload");
        String uploadDir = "src/main/resources/uploads/party" + partyId + "/";
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        for (FileUpload file : input.file) {
            // TODO: Use current user
            String timestampedFilename = Instant.now().toString() + "_" + file.fileName();
            String relativePath = "party" + partyId + "/" + timestampedFilename;
            Media media = new Media(partyRepository.getPartyById(partyId), userRepository.getUser(DEFAULT_USER_ID), relativePath);
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
                media.getId(),
                media.getParty().getId(),
                media.getUrl()
        );
    }
    public Response getImgByMediaId(long id) {
        Media media = entityManager.find(Media.class, id);
        String path;
        //TODO:sanitize path
        String pic = media.getUrl();
        path = "src/main/resources/uploads/party" + media.getParty().getId() + "/" + pic;
        try {
            logger.info(Paths.get(path));
            InputStream is = Files.newInputStream(Paths.get(path));
            String lower = pic.toLowerCase();
            String type = "application/octet-stream";
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) type = "image/jpeg";
            else if (lower.endsWith(".png")) type = "image/png";
            else if (lower.endsWith(".gif")) type = "image/gif";
            return Response.ok(is, type).build();
        } catch (IOException e) {
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }


    public long getMediaCountByUserId(Long userId) {
        return entityManager.createQuery(
                "SELECT COUNT(m) FROM Media m WHERE m.user.id = :userId",
                Long.class)
                .setParameter("userId", userId)
                .getSingleResult();
    }

    public List<MediaDto> getMediaByUserId(Long userId) {
        List<Media> mediaList = entityManager.createQuery(
                "SELECT m FROM Media m WHERE m.user.id = :userId",
                Media.class)
                .setParameter("userId", userId)
                .getResultList();
        return mediaList.stream().map(this::toMediaDto).collect(Collectors.toList());
    }

}
