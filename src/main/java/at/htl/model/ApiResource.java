package at.htl.model;

import at.htl.entity.Category;
import at.htl.entity.Image;
import at.htl.entity.Party;
import at.htl.entity.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ApiResource {
    @Inject
    Logger logger;

    @PersistenceContext
    EntityManager entityManager;

    @GET
    @Path("/users")
    public List<User> getUsers() {
        return entityManager.createQuery("SELECT u FROM User u", User.class).getResultList();
    }

    @GET
    @Path("/categories")
    public List<Category> getCategory() {
        return entityManager.createQuery("SELECT c FROM Category c", Category.class).getResultList();
    }

    @GET
    @Path("/parties")
    public List<Party> getParties() {
        return entityManager.createQuery("SELECT p FROM Party p", Party.class).getResultList();
    }

    @GET
    @Path("/users/{id}")
    public User getUser(@PathParam("id") long id) {
        return entityManager.find(User.class, id);
    }

    @GET
    @Path("/images/{party}/")
    public List<Image> getImages(@PathParam("party") long partyId) {
        List<Image> result = new ArrayList<>();
        boolean access = entityManager.createQuery("SELECT userId FROM PartyAttendees WHERE partyId=" + partyId).getResultList().stream().findFirst().isPresent();
        logger.log(Logger.Level.INFO, "access? " + access);

        if (access) {
            result = entityManager.createQuery("SELECT url FROM Image WHERE party_id=" + partyId).getResultList();
        }
        return result;
    }

    @POST
    @Path("/upload/{partyId}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response upload(FileUploadInput input, @PathParam("partyId") long partyId) throws IOException {
        logger.log(Logger.Level.DEBUG, "upload");
        String uploadDir = "src/main/resources/uploads/party" + partyId + "/";
        Files.createDirectories(Paths.get(uploadDir));
        for (FileUpload file : input.file) {
            Image image = new Image(partyId, 1L, file.fileName());
            System.out.println(image.toString());
            entityManager.persist(image);
            java.nio.file.Path uploadedFile = file.uploadedFile();
            java.nio.file.Path targetLocation = Paths.get(uploadDir, file.fileName());
            Files.move(uploadedFile, targetLocation);
            logger.log(Logger.Level.INFO, "File saved to: " + targetLocation);
        }
        return Response.ok().build();
    }

    public static class FileUploadInput {

        @FormParam("text")
        public String text;

        @FormParam("file")
        public List<FileUpload> file;

    }
}