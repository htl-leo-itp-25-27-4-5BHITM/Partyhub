package at.htl.repository;

import at.htl.model.Media;
import at.htl.model.Party;
import at.htl.model.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class MediaRepository {


    @Inject
    EntityManager entityManager;
    @Inject
    PartyRepository partyRepository;
    @Inject
    Logger logger;

    public List<Media> getImages(long partyId) {
        List<Media> result = new ArrayList<>();
        //boolean access = entityManager.createQuery("SELECT user FROM Attendees WHERE party.id=" + partyId).getResultList().stream().findFirst().isPresent();
//        if (access) {
//            result = entityManager.createQuery("SELECT url FROM Media WHERE party.id=" + partyId).getResultList();
//        }
        return result;
    }

    public Response upload(FileUploadInput input,  long partyId) throws IOException {
        // TODO: Sanitize uploads
        logger.log(Logger.Level.DEBUG, "upload");
        String uploadDir = "src/main/resources/uploads/party" + partyId + "/";
        Files.createDirectories(Paths.get(uploadDir));
        for (FileUpload file : input.file) {
            // TODO: Use correct media path for db
            Media media = new Media(partyRepository.getPartyById(partyId).readEntity(Party.class), User.getUserById(1L, entityManager), file.fileName());
            entityManager.persist(media);
            java.nio.file.Path uploadedFile = file.uploadedFile();
            java.nio.file.Path targetLocation = Paths.get(uploadDir, Instant.now().toString() + file.fileName());
            Files.move(uploadedFile, targetLocation);
            logger.log(Logger.Level.INFO, "File saved to: " + targetLocation);
        }
        return Response.ok().build();
    }

    public static class FileUploadInput {
        @FormParam("file")
        public List<FileUpload> file;
    }

}
