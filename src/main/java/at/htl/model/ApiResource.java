package at.htl.model;

import at.htl.entity.*;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.Claims;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.NoCache;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ApiResource {
    @Inject
    Logger logger;

    @Inject
    JsonWebToken jwt;

    @Inject
    SecurityIdentity identity;

    @PersistenceContext
    EntityManager entityManager;

    @GET
    @Path("/users/me")
    @NoCache
    public User me() {
        return new User(jwt);
    }

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
    @Path("/users/{id}")
    public User getUser(@PathParam("id") long id) {
        return entityManager.find(User.class, id);
    }

    @GET
    @Path("/media/{party}")
    public List<Media> getImages(@PathParam("party") long partyId) {
        List<Media> result = new ArrayList<>();
        boolean access = entityManager.createQuery("SELECT user FROM PartyAttendees WHERE party.id=" + partyId).getResultList().stream().findFirst().isPresent();
        if (access) {
            result = entityManager.createQuery("SELECT url FROM Media WHERE party.id=" + partyId).getResultList();
        }
        return result;
    }

    @POST
    @Path("/media/upload/{partyId}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response upload(FileUploadInput input, @PathParam("partyId") long partyId) throws IOException {
        // TODO: Sanitize uploads
        logger.log(Logger.Level.DEBUG, "upload");
        String uploadDir = "src/main/resources/uploads/party" + partyId + "/";
        Files.createDirectories(Paths.get(uploadDir));
        for (FileUpload file : input.file) {
            // TODO: Use correct media path for db
            Media media = new Media(Party.getPartyById(partyId, entityManager), User.getUserById(1L, entityManager), file.fileName());
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

    @POST
    @Transactional
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/party/add")
    public Response addParty(@FormParam("category_id") Long category_id, @FormParam("time_start") LocalDateTime start, @FormParam("time_end")LocalDateTime end, @FormParam("max_people") int max_people, @FormParam("min_age")  int min_age, @FormParam("max_age") int max_age) {
        Party party = new Party(User.getUserById(1L, entityManager), Category.getCategoryById(category_id, entityManager), "testTitle", start, end, max_people, min_age, max_age, "TestDescription", 0.0, 0.0, 1.0);
        logger.log(Logger.Level.INFO, "addParty");
        logger.info(party.toString());
        entityManager.persist(party);
        return Response.ok().build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Path("/party")
    public Response getParties() {
        List <Party> result;
        result = entityManager.createQuery("SELECT u FROM Party u", Party.class).getResultList();
        logger.info(result.get(1));
        logger.info(Response.ok().entity(result).build());
        return Response.ok().entity(result).build();
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Path("/party/filter")
    public List<Party> filterParty(@QueryParam("filter") String filterType, @FormParam("param")  String filterParam) {
        logger.log(Logger.Level.INFO, filterType + " filter" +  filterParam);
        String query;
        if(filterType.equals("content")){
            query = "SELECT p FROM Party p WHERE LOWER( p.title) LIKE lower(:filterParam) OR lower(p.description) LIKE lower(:filterParam)";
        } else{
            return null;
        }
        String likePattern = "%" + filterParam.trim() + "%";
        return entityManager.createQuery(query,
                Party.class)
        .setParameter("filterParam", likePattern)
        .getResultList();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/party/sort")
    public List<Party> sortParty(@QueryParam("sort") String sort) {
        String query;
        if (sort.equals("asc")) {
            query = "SELECT p FROM Party p ORDER BY p.time_start ASC, p.time_end ASC";
        }
        else if (sort.equals("desc")) {
            query = "SELECT p FROM Party p ORDER BY p.time_start DESC, p.time_end DESC";
        }
        else{
            logger.log(Logger.Level.ERROR, "sort not supported");
            return null;
        }
        return entityManager.createQuery(
                        query,
                        Party.class)
                .getResultList();
    }

    @POST
    @Transactional
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/party/attend/{id}")
    public Response attendParty (@PathParam("id") Long party_id) {
        PartyAttendees pa = new PartyAttendees(Party.getPartyById(party_id, entityManager), User.getUserById(1L, entityManager));
        entityManager.persist(pa);
        logger.info(pa.getId());
        return Response.status(Response.Status.CREATED).build();
    }
}
