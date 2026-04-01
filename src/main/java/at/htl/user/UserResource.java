package at.htl.user;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;

import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import at.htl.follow.FollowRepository;
import at.htl.keycloak.KeycloakContextService;
import at.htl.media.MediaRepository;
import at.htl.profile_picture.ProfilePicture;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
@Path("/api/users")
public class UserResource {
    @Inject
    UserRepository userRepository;
    @Inject
    FollowRepository followRepository;
    @Inject
    MediaRepository mediaRepository;
    @Inject
    EntityManager em;
    @Inject
    Logger logger;
    @Inject
    KeycloakContextService keycloakContext;
    @Inject
    KeycloakUserService keycloakUserService;

    private static final String UPLOAD_DIR = "src/main/resources/uploads/profiles/";
    private static final String DEFAULT_IMAGE = "/META-INF/resources/images/default_profile-picture.svg";

    @POST
    @Transactional
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("")
    public Response createUser(UserCreateDto userCreateDto) {
        return userRepository.createUser(createUserDtoToUser(userCreateDto));
    }

    private User createUserDtoToUser(UserCreateDto userCreateDto) {
        User user = new User();
        user.setDisplayName(userCreateDto.displayName());
        user.setDistinctName(userCreateDto.distinctName());
        user.setEmail(userCreateDto.email());
        user.setBiography(userCreateDto.biography());
        return user;
    }

    @GET
    @Path("/all")
    public Response getUsers() {
        List<User> users = userRepository.getUsers();
        return Response.ok(users).build();
    }

    @GET
    @Path("/all/search")
    public Response getUsersByDistinctNameSubstring(@QueryParam("name") String distinctName) {
        List<User> users = userRepository.getUsersByDistinctNameSearch(distinctName);
        return Response.ok(users).build();
    }

    @GET
    @Path("/{id}")
    public Response getUser(@PathParam("id") long id) {
        User user = userRepository.getUser(id);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(user).build();
    }

    @GET
    @Path("/handle/{distinctName}")
    public Response getUserByDistinctName(@PathParam("distinctName") String distinctName) {
        User user = userRepository.findByDistinctName(distinctName);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(user).build();
    }

    @GET
    @Path("/username/{username}")
    public Response getUserByUsername(@PathParam("username") String username) {
        var user = userRepository.findByUsername(username);
        if (user.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(user.get()).build();
    }

    @GET
    @Authenticated
    @Path("/me")
    public Response getCurrentUser() {
        var currentUser = keycloakUserService.getOrCreateCurrentUser();
        if (currentUser.isEmpty()) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        return Response.ok(currentUser.get()).build();
    }

    @GET
    @Path("/{id}/followers/count")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getFollowerCount(@PathParam("id") long id) {
        User user = userRepository.getUser(id);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        long count = followRepository.getFollowerCount(id);
        return Response.ok().entity("{\"count\": " + count + "}").build();
    }

    @GET
    @Path("/{id}/following/count")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getFollowingCount(@PathParam("id") long id) {
        User user = userRepository.getUser(id);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        long count = followRepository.getFollowingCount(id);
        return Response.ok().entity("{\"count\": " + count + "}").build();
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Authenticated
    public Response updateUser(@PathParam("id") long id, UserCreateDto userCreateDto) {
        logger.info("updateUser called with id: " + id);
        
        User user = em.find(User.class, id);
        if (user == null) {
            logger.warn("User not found: " + id);
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        
        user.setDisplayName(userCreateDto.displayName());
        user.setDistinctName(userCreateDto.distinctName());
        user.setEmail(userCreateDto.email());
        user.setBiography(userCreateDto.biography());
        
        User merged = em.merge(user);
        logger.info("User merged successfully: " + merged.getId());
        
        return Response.ok(merged).build();
    }


    @GET
    @Path("/{id}/profile-picture")
    @Produces({"image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"})
    public Response getProfilePicture(@PathParam("id") long id) {
        User user = em.find(User.class, id);
        if (user == null) {
            logger.log(Logger.Level.WARN, "User not found with id: " + id);
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        ProfilePicture pic = user.getProfilePicture();
        if (pic == null || pic.getPicture_name() == null) {
            return serveDefaultImage();
        }

        String filename = pic.getPicture_name();
        String path = UPLOAD_DIR + filename;

        try {
            if (!Files.exists(Paths.get(path))) {
                return serveDefaultImage();
            }

            InputStream is = Files.newInputStream(Paths.get(path));
            String type = getMediaType(filename);
            return Response.ok(is, type).build();
        } catch (IOException e) {
            logger.log(Logger.Level.ERROR, "Failed to read profile picture: " + e.getMessage());
            return serveDefaultImage();
        }
    }

    private Response serveDefaultImage() {
        InputStream is = getClass().getResourceAsStream(DEFAULT_IMAGE);
        if (is != null) {
            return Response.ok(is, "image/svg+xml").build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    private String getMediaType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        return "application/octet-stream";
    }

    @GET
    @Path("/{id}/profile-picture-filename")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getProfilePictureFilename(@PathParam("id") long id) {
        User user = em.find(User.class, id);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        ProfilePicture pic = user.getProfilePicture();
        if (pic == null || pic.getPicture_name() == null) {
            return Response.ok().entity("{\"filename\": null}").build();
        }

        return Response.ok().entity("{\"filename\": \"" + pic.getPicture_name() + "\"}").build();
    }

    @POST
    @Path("/{id}/upload-profile-picture")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response uploadProfilePicture(@PathParam("id") long id, @FormParam("file") FileUpload fileUpload) throws Exception {
        logger.info("uploadProfilePicture called for user: " + id);

        // Delete ALL existing profile pictures for this user first
        em.createQuery("DELETE FROM ProfilePicture p WHERE p.user.id = :userId")
          .setParameter("userId", id)
          .executeUpdate();

        User user = em.find(User.class, id);
        
        // Save file
        Files.createDirectories(Paths.get(UPLOAD_DIR));
        String fileExtension = getFileExtension(fileUpload.fileName());
        String newFilename = "profile_" + id + "_" + Instant.now().toEpochMilli() + fileExtension;
        java.nio.file.Path targetLocation = Paths.get(UPLOAD_DIR, newFilename);
        Files.move(fileUpload.uploadedFile(), targetLocation);
        
        // Create new
        ProfilePicture profilePicture = new ProfilePicture(newFilename, user);
        em.persist(profilePicture);
        
        user.setProfilePicture(profilePicture);
        em.merge(user);
        
        return Response.ok().entity("{\"filename\": \"" + newFilename + "\"}").build();
    }

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0) {
            return filename.substring(lastDotIndex);
        }
        return ".jpg";
    }
}
