package at.htl.user;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;

import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import at.htl.follow.FollowRepository;
import at.htl.media.MediaRepository;
import at.htl.profile_picture.ProfilePicture;
import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
@jakarta.ws.rs.Path("/api/users")
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

    // Persistenter Upload-Pfad (prod/dev überschreibbar via Quarkus config)
    @ConfigProperty(name = "partyhub.profile-picture.upload-dir", defaultValue = "uploads/profiles")
    String uploadDir;

    private static final String LEGACY_UPLOAD_DIR = "src/main/resources/uploads/profiles";
    private static final String DEFAULT_IMAGE = "/META-INF/resources/images/default_profile-picture.svg";

    @POST
    @Transactional
    @Consumes(MediaType.APPLICATION_JSON)
    @jakarta.ws.rs.Path("")
    public Response createUser(@Valid UserCreateDto userCreateDto) {
        return userRepository.createUser(createUserDtoToUser(userCreateDto));
    }

    @GET
    @jakarta.ws.rs.Path("")
    public Response getUsers(@QueryParam("q") String query) {
        if (query != null && !query.isBlank()) {
            List<User> users = userRepository.getUsersByDistinctNameSearch(query);
            return Response.ok(users).build();
        }
        List<User> users = userRepository.getUsers();
        return Response.ok(users).build();
    }

    private User createUserDtoToUser(UserCreateDto userCreateDto) {
        User user = new User();
        user.setDisplayName(userCreateDto.displayName());
        user.setDistinctName(userCreateDto.distinctName());
        user.setEmail(userCreateDto.email());
        user.setPhoneNumber(userCreateDto.phoneNumber());
        user.setBiography(userCreateDto.biography());
        return user;
    }

    @GET
    @jakarta.ws.rs.Path("/{id}")
    public Response getUser(@PathParam("id") long id) {
        User user = userRepository.getUser(id);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(user).build();
    }

    @GET
    @jakarta.ws.rs.Path("/handle/{distinctName}")
    public Response getUserByDistinctName(@PathParam("distinctName") String distinctName) {
        User user = userRepository.findByDistinctName(distinctName);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(user).build();
    }

    @GET
    @jakarta.ws.rs.Path("/username/{username}")
    public Response getUserByUsername(@PathParam("username") String username) {
        var user = userRepository.findByUsername(username);
        if (user.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(user.get()).build();
    }

    @GET
    @PermitAll
    @jakarta.ws.rs.Path("/me")
    public Response getCurrentUser(@QueryParam("userId") Long userId) {
        if (userId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("{\"error\": \"userId parameter required\"}").build();
        }
        var user = userRepository.findById(userId);
        if (user.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(user.get()).build();
    }

    @GET
    @jakarta.ws.rs.Path("/{id}/followers/count")
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
    @jakarta.ws.rs.Path("/{id}/following/count")
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
    @jakarta.ws.rs.Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @PermitAll
    public Response updateUser(@PathParam("id") long id, @Valid UserCreateDto userCreateDto) {
        logger.info("updateUser called with id: " + id);
        
        User user = em.find(User.class, id);
        if (user == null) {
            logger.warn("User not found: " + id);
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        
        user.setDisplayName(userCreateDto.displayName());
        user.setDistinctName(userCreateDto.distinctName());
        user.setEmail(userCreateDto.email());
        user.setPhoneNumber(userCreateDto.phoneNumber());
        user.setBiography(userCreateDto.biography());
        
        User merged = em.merge(user);
        logger.info("User merged successfully: " + merged.getId());
        
        return Response.ok(merged).build();
    }


    @GET
    @jakarta.ws.rs.Path("/{id}/profile-picture")
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

        try {
            Path picturePath = resolveExistingProfilePicturePath(filename);
            if (picturePath == null) {
                return serveDefaultImage();
            }

            InputStream is = Files.newInputStream(picturePath);
            String type = getMediaType(filename);
            return Response.ok(is, type).build();
        } catch (IOException e) {
            logger.log(Logger.Level.ERROR, "Failed to read profile picture: " + e.getMessage());
            return serveDefaultImage();
        }
    }

    private Path resolveExistingProfilePicturePath(String filename) {
        Path primary = Paths.get(uploadDir).resolve(filename);
        if (Files.exists(primary)) {
            return primary;
        }

        Path legacy = Paths.get(LEGACY_UPLOAD_DIR).resolve(filename);
        if (Files.exists(legacy)) {
            return legacy;
        }

        return null;
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
    @jakarta.ws.rs.Path("/{id}/profile-picture-filename")
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
    @jakarta.ws.rs.Path("/{id}/upload-profile-picture")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response uploadProfilePicture(@PathParam("id") long id, @FormParam("file") FileUpload fileUpload) throws Exception {
        logger.info("uploadProfilePicture called for user: " + id);

        em.createQuery("DELETE FROM ProfilePicture p WHERE p.user.id = :userId")
          .setParameter("userId", id)
          .executeUpdate();

        User user = em.find(User.class, id);
        
        Path uploadPath = Paths.get(uploadDir);
        Files.createDirectories(uploadPath);
        String fileExtension = getFileExtension(fileUpload.fileName());
        String newFilename = "profile_" + id + "_" + Instant.now().toEpochMilli() + fileExtension;
        Path targetLocation = uploadPath.resolve(newFilename);
        Files.move(fileUpload.uploadedFile(), targetLocation);
        
        ProfilePicture profilePicture = new ProfilePicture(newFilename, user);
        em.persist(profilePicture);
        
        user.setProfilePicture(profilePicture);
        em.merge(user);
        
        return Response.ok().entity("{\"filename\": \"" + newFilename + "\"}").build();
    }

    @GET
    @jakarta.ws.rs.Path("/{id}/followers")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getFollowers(@PathParam("id") long id) {
        List<User> followers = followRepository.getFollowers(id);
        return Response.ok(followers).build();
    }

    @GET
    @jakarta.ws.rs.Path("/{id}/following")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getFollowing(@PathParam("id") long id) {
        List<User> following = followRepository.getFollowing(id);
        return Response.ok(following).build();
    }

    @GET
    @jakarta.ws.rs.Path("/{id}/follow-requests")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getFollowRequests(@PathParam("id") long id) {
        List<User> pending = followRepository.getPendingFollowerRequests(id);
        return Response.ok(pending).build();
    }

    @GET
    @jakarta.ws.rs.Path("/{userId1}/followers/{userId2}/status")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getFollowStatus(@PathParam("userId1") long userId1,
                                   @PathParam("userId2") long userId2) {
        boolean following = followRepository.isFollowing(userId1, userId2);
        return Response.ok(following).build();
    }

    @POST
    @jakarta.ws.rs.Path("/{id}/follow")
    @Produces(MediaType.APPLICATION_JSON)
    public Response followUser(@PathParam("id") long id,
                               @QueryParam("targetUserId") Long targetUserId) {
        if (targetUserId == null) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        return followRepository.createFollowRequest(id, targetUserId);
    }

    @PUT
    @jakarta.ws.rs.Path("/{id}/followers/{followerId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response acceptFollow(@PathParam("id") long id,
                                @PathParam("followerId") long followerId) {
        return followRepository.acceptFollowRequest(followerId, id);
    }

    @DELETE
    @jakarta.ws.rs.Path("/{id}/followers/{followerId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response unfollowUser(@PathParam("id") long id,
                                @PathParam("followerId") long followerId) {
        return followRepository.removeFollow(followerId, id);
    }

    @GET
    @jakarta.ws.rs.Path("/location/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getUserLocation(@PathParam("id") long userId) {
        at.htl.user_location.UserLocation location = em.find(at.htl.user_location.UserLocation.class, userId);
        if (location == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(location).build();
    }

    @PUT
    @jakarta.ws.rs.Path("/location")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response updateUserLocation(@HeaderParam("X-User-Id") Long userId,
                                       @Valid at.htl.user_location.UserLocationUpdateDto dto) {
        if (userId == null) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

        User user = em.find(User.class, userId);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        at.htl.user_location.UserLocation existingLocation = em.find(at.htl.user_location.UserLocation.class, userId);

        if (existingLocation != null) {
            existingLocation.setLatitude(dto.latitude());
            existingLocation.setLongitude(dto.longitude());
            em.merge(existingLocation);
            return Response.ok(existingLocation).build();
        } else {
            at.htl.user_location.UserLocation newLocation = new at.htl.user_location.UserLocation();
            newLocation.setUser(user);
            newLocation.setLatitude(dto.latitude());
            newLocation.setLongitude(dto.longitude());
            em.persist(newLocation);
            return Response.ok(newLocation).build();
        }
    }

    @GET
    @jakarta.ws.rs.Path("/{id}/media")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getUserMedia(@PathParam("id") long userId) {
        return Response.ok().entity(mediaRepository.getMediaByUser(userId)).build();
    }

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0) {
            return filename.substring(lastDotIndex);
        }
        return ".jpg";
    }
    @PUT
@jakarta.ws.rs.Path("/device-token")
@Transactional
public Response updateDeviceToken(@QueryParam("token") String token, 
                                  @HeaderParam("X-User-Id") Long userId) {
    if (userId == null || token == null) return Response.status(400).build();
    
    em.createNativeQuery("UPDATE users SET device_token = :token WHERE id = :id")
      .setParameter("token", token)
      .setParameter("id", userId)
      .executeUpdate();
      
    return Response.ok().build();
}
}
