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

    public List<MediaDto> getImages(long partyId) {
        // TODO: Use current user
        Long userId = 4L;
        boolean access = !entityManager.createQuery(
                        "SELECT p.id " +
                                "FROM Party p " +
                                "LEFT JOIN p.users u " +
                                "WHERE p.id = :partyId " +
                                "AND ( p.host_user.id = :userId " +
                                "      OR u.id = :userId )",
                        Long.class)
                .setParameter("partyId", partyId)
                .setParameter("userId", userId)
                .getResultList()
                .isEmpty();
        logger.info(access);
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
            // TODO: Use correct media path for db
            // TODO: Use current user
            Media media = new Media(partyRepository.getPartyById(partyId), userRepository.getUser(1L), file.fileName());
            entityManager.persist(media);
            java.nio.file.Path uploadedFile = file.uploadedFile();
            java.nio.file.Path targetLocation = Paths.get(uploadDir, Instant.now().toString() + file.fileName());
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
                media.getUser().getId(),
                media.getUrl()
        );
    }

}
