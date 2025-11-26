package at.htl.control;

import at.htl.entity.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class PartyRepository {

    @PersistenceContext
    EntityManager em;

    Logger logger = Logger.getLogger(Logger.class.getName());


    @Transactional
    public List<Party> getAllParties() {
        return em.createQuery("SELECT p FROM Party p", Party.class).getResultList();
    }

    public List<Party> filterParty(String filterType, String filterParam) {
        if (filterType.equals("title")) {
            String query = "SELECT p FROM Party p WHERE LOWER(p.title) LIKE lower(:filterParam) OR lower(p.description) LIKE lower(:filterParam)";
            String likePattern = "%" + filterParam.trim() + "%";
            return em.createQuery(query, Party.class)
                    .setParameter("filterParam", likePattern)
                    .getResultList();
        } else if (filterType.equals("description")) {
            String query = "SELECT p FROM Party p WHERE p.category = :categoryId";
            return em.createQuery(query, Party.class)
                    .setParameter("categoryId", Integer.parseInt(filterParam.trim()))
                    .getResultList();
        } else if (filterType.equals("date")) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss");
            LocalDateTime dateTime = LocalDateTime.parse(filterParam.trim(), formatter);
            String query = "SELECT p FROM Party p WHERE p.time_start = :filterParam";
            return em.createQuery(query, Party.class)
                    .setParameter("filterParam", dateTime)
                    .getResultList();
        } else {
            return new ArrayList<>();
        }
    }

    public List<Party> sortParty(String sort) {
        String query;
        if ("asc".equals(sort)) {
            query = "SELECT p FROM Party p ORDER BY p.time_start ASC, p.time_end ASC";
        } else if ("desc".equals(sort)) {
            query = "SELECT p FROM Party p ORDER BY p.time_start DESC, p.time_end DESC";
        } else {
            return new ArrayList<>();
        }
        return em.createQuery(query, Party.class).getResultList();
    }

    @Transactional
    public Response attendParty(Long partyId, User user) {

        Party party = em.find(Party.class, partyId);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("Party not found")
                    .build();
        }
        PartyAttendees pa = new PartyAttendees(party, user);
        em.persist(pa);
        logger.info(pa.getId());
        return Response.status(Response.Status.CREATED).build();
    }



    @Transactional
    public Party addParty(User owner, Long categoryId, String title, LocalDateTime start, LocalDateTime end,
                          int maxPeople, int minAge, int maxAge, String description) {

        Category category = Category.getCategoryById(categoryId, em);
        Party party = new Party(owner, category, title, start, end, maxPeople, minAge, maxAge, description);
        em.persist(party);
        return party;
    }

    @Transactional
    public Response updateParty(Long partyId, Long categoryId, LocalDateTime timeStart, LocalDateTime timeEnd,
                             Integer maxPeople, Integer minAge, Integer maxAge,
                             String title, String description) {
        Party party = em.find(Party.class, partyId);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("Party with ID " + partyId + " not found.")
                    .build();
        }
        if (categoryId != null) {
            Category category = Category.getCategoryById(categoryId, em);
            if (category != null) {
                party.setCategory(category);
            }
        }
        if (timeStart != null) party.setTime_start(timeStart);
        if (timeEnd != null) party.setTime_end(timeEnd);
        if (maxPeople != null) party.setMax_people(maxPeople);
        if (minAge != null) party.setMin_age(minAge);
        if (maxAge != null) party.setMax_age(maxAge);
        if (title != null) party.setTitle(title);
        if (description != null) party.setDescription(description);

        logger.log(Logger.Level.INFO, "updateParty");
        logger.info(party.toString());

        em.merge(party);
        return Response.ok(party).build();
    }

    @Transactional
    public List<Media> uploadMedia(Long partyId, User uploader, List<MediaFile> files, String uploadRoot) throws IOException {
        List<Media> uploaded = new ArrayList<>();
        Party party = em.find(Party.class, partyId);
        if (party == null) return uploaded;

        String uploadDir = uploadRoot + "/party" + partyId + "/";
        Files.createDirectories(Paths.get(uploadDir));

        for (MediaFile file : files) {
            Media media = new Media(party, uploader, file.getFileName());
            em.persist(media);

            Path target = Paths.get(uploadDir, Instant.now().toString() + "_" + file.getFileName());
            Files.move(file.getPath(), target);

            uploaded.add(media);
        }
        return uploaded;
    }


    public List<Media> getPartyMedia(Long partyId) {
        boolean access = !em.createQuery("SELECT pa.user FROM PartyAttendees pa WHERE pa.party.id = :partyId")
                .setParameter("partyId", partyId)
                .getResultList().isEmpty();
        if (!access) return new ArrayList<>();
        return em.createQuery("SELECT m FROM Media m WHERE m.party.id = :partyId", Media.class)
                .setParameter("partyId", partyId)
                .getResultList();
    }

    public List<User> getUsers() {
        return em.createQuery("SELECT u FROM User u", User.class).getResultList();

    }

    public List<Category> getCategory() {
        return em.createQuery("SELECT c FROM Category c", Category.class).getResultList();

    }

    public User getUser(Long id) {
        return em.find(User.class, id);


    }

    public List<Media> getImages(long partyId) {
        List<Media> result = new ArrayList<>();
        boolean access = em.createQuery("SELECT user FROM PartyAttendees WHERE party.id=" + partyId).getResultList().stream().findFirst().isPresent();
        if (access) {
            result = em.createQuery("SELECT url FROM Media WHERE party.id=" + partyId).getResultList();
        }
        return result;

    }

    public Response upload(FileUploadInput input, long partyId) throws IOException {
           logger.log(Logger.Level.DEBUG, "upload");
        String uploadDir = "src/main/resources/uploads/party" + partyId + "/";
        Files.createDirectories(Paths.get(uploadDir));
        for (FileUpload file : input.file) {
            Media media = new Media(Party.getPartyById(partyId, em), User.getUserById(1L, em), file.fileName());
            em.persist(media);
            java.nio.file.Path uploadedFile = file.uploadedFile();
            java.nio.file.Path targetLocation = Paths.get(uploadDir, Instant.now().toString() + file.fileName());
            Files.move(uploadedFile, targetLocation);
            logger.log(Logger.Level.INFO, "File saved to: " + targetLocation);
        }
        return Response.ok().build();

    }

    public Response addParty(Long categoryId, LocalDateTime start, LocalDateTime end, int maxPeople, int minAge, int maxAge) {
        Party party = new Party(User.getUserById(1L, em), Category.getCategoryById(categoryId, em), "testTitle", start, end, maxPeople, minAge, maxAge, "TestDescription");
        logger.log(Logger.Level.INFO, "addParty");
        logger.info(party.toString());
        em.persist(party);
        return Response.ok().build();
    }

    public Response getParties() {
        List<Party> result;
        result = em.createQuery("SELECT u FROM Party u", Party.class).getResultList();
        logger.info(result.get(1));
        logger.info(Response.ok().entity(result).build());
        return Response.ok().entity(result).build();
    }

    public static class FileUploadInput {
        @FormParam("file")
        public List<FileUpload> file;

    }


    public static class MediaFile {
        private Path path;
        private String fileName;

        public MediaFile(Path path, String fileName) {
            this.path = path;
            this.fileName = fileName;
        }

        public Path getPath() { return path; }
        public String getFileName() { return fileName; }
    }

}