package at.htl.user;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import at.htl.media.ImageType;
import jakarta.transaction.Status;
import jakarta.transaction.Synchronization;
import jakarta.transaction.TransactionSynchronizationRegistry;

import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import at.htl.auth.CurrentUserResolver;
import at.htl.follow.FollowRepository;
import at.htl.media.MediaRepository;
import at.htl.profile_picture.ProfilePicture;
import io.quarkus.security.Authenticated;
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
    CurrentUserResolver currentUserResolver;
    @Inject
    EntityManager em;
    @Inject
    Logger logger;

    @Inject
    TransactionSynchronizationRegistry transactions;

    // Persistenter Upload-Pfad (prod/dev überschreibbar via Quarkus config)
    @ConfigProperty(name = "partyhub.profile-picture.upload-dir", defaultValue = "uploads/profiles")
    String uploadDir;

    private static final String DEFAULT_IMAGE = "/META-INF/resources/images/default_profile-picture.svg";

    @POST
    @Transactional
    @Consumes(MediaType.APPLICATION_JSON)
    @jakarta.ws.rs.Path("")
    @Authenticated
    public Response createUser(@jakarta.validation.constraints.NotNull @Valid UserCreateDto userCreateDto) {
        // Identity provisioning is owned by Keycloak, never by an arbitrary request body.
        return Response.status(Response.Status.FORBIDDEN).entity(Map.of("error", "identity_managed_by_keycloak")).build();
    }

    @GET
    @jakarta.ws.rs.Path("")
    @Authenticated
    public Response getUsers(@QueryParam("q") @jakarta.validation.constraints.Size(max=200) String query) {
        if (query != null && !query.isBlank()) {
            List<User> users = userRepository.getUsersByDistinctNameSearch(query);
            return Response.ok(users.stream().map(u -> ProfileDto.from(u, false)).toList()).build();
        }
        List<User> users = userRepository.getUsers();
        return Response.ok(users.stream().map(u -> ProfileDto.from(u, false)).toList()).build();
    }

    @GET
    @jakarta.ws.rs.Path("/{id}")
    @Authenticated
    public Response getUser(@PathParam("id") @jakarta.validation.constraints.Positive long id) {
        User user = userRepository.getUser(id);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(ProfileDto.from(user, user.getId().equals(currentUserResolver.requireCurrentUserId()))).build();
    }

    @GET
    @jakarta.ws.rs.Path("/handle/{distinctName}")
    @Authenticated
    public Response getUserByDistinctName(@PathParam("distinctName") String distinctName) {
        User user = userRepository.findByDistinctName(distinctName);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(ProfileDto.from(user, user.getId().equals(currentUserResolver.requireCurrentUserId()))).build();
    }

    @GET
    @jakarta.ws.rs.Path("/username/{username}")
    @Authenticated
    public Response getUserByUsername(@PathParam("username") String username) {
        var user = userRepository.findByUsername(username);
        if (user.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(ProfileDto.from(user.get(), user.get().getId().equals(currentUserResolver.requireCurrentUserId()))).build();
    }

    @GET
    @jakarta.ws.rs.Path("/me")
    @Authenticated
    public Response getCurrentUser() {
        return Response.ok(ProfileDto.from(currentUserResolver.requireCurrentUser(), true)).build();
    }

    @GET
    @jakarta.ws.rs.Path("/{id}/followers/count")
    @Produces(MediaType.APPLICATION_JSON)
    @Authenticated
    public Response getFollowerCount(@PathParam("id") @jakarta.validation.constraints.Positive long id) {
        User user = userRepository.getUser(id);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        long count = followRepository.getFollowerCount(id);
        return Response.ok().entity(java.util.Map.of("count", count)).build();
    }

    @GET
    @jakarta.ws.rs.Path("/{id}/following/count")
    @Produces(MediaType.APPLICATION_JSON)
    @Authenticated
    public Response getFollowingCount(@PathParam("id") @jakarta.validation.constraints.Positive long id) {
        User user = userRepository.getUser(id);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        long count = followRepository.getFollowingCount(id);
        return Response.ok().entity(java.util.Map.of("count", count)).build();
    }

    @PUT
    @jakarta.ws.rs.Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Authenticated
    public Response updateUser(@PathParam("id") @jakarta.validation.constraints.Positive long id, @jakarta.validation.constraints.NotNull @Valid UserCreateDto userCreateDto) {
        logger.info("updateUser called with id: " + id);
        User currentUser = currentUserResolver.requireCurrentUser();
        if (!currentUser.getId().equals(id)) {
            return Response.status(Response.Status.FORBIDDEN).build();
        }
        
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
        user.setGender(userCreateDto.gender());
        user.setBirthDate(userCreateDto.birthDate());
        
        User merged = em.merge(user);
        logger.info("User merged successfully: " + merged.getId());
        
        return Response.ok(ProfileDto.from(merged, true)).build();
    }


    @GET
    @jakarta.ws.rs.Path("/{id}/profile-picture")
    @Produces({"image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"})
    public Response getProfilePicture(@PathParam("id") @jakarta.validation.constraints.Positive long id) {
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

            ImageType type = ImageType.detect(picturePath).orElse(null);
            if (type == null) return serveDefaultImage();
            InputStream is = Files.newInputStream(picturePath);
            return Response.ok(is, type.mediaType()).header("X-Content-Type-Options", "nosniff").build();
        } catch (IOException e) {
            logger.log(Logger.Level.ERROR, "Failed to read profile picture: " + e.getMessage());
            return serveDefaultImage();
        }
    }

    private Path resolveExistingProfilePicturePath(String filename) {
        Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path path = base.resolve(filename).normalize();
        if (!path.startsWith(base) || !Files.isRegularFile(path)) return null;
        try {
            return path.toRealPath().startsWith(base.toRealPath()) ? path : null;
        } catch (IOException e) {
            return null;
        }
    }

    private Response serveDefaultImage() {
        InputStream is = getClass().getResourceAsStream(DEFAULT_IMAGE);
        if (is != null) {
            return Response.ok(is, "image/svg+xml").build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    @GET
    @jakarta.ws.rs.Path("/{id}/profile-picture-filename")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getProfilePictureFilename(@PathParam("id") @jakarta.validation.constraints.Positive long id) {
        User user = em.find(User.class, id);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        ProfilePicture pic = user.getProfilePicture();
        if (pic == null || pic.getPicture_name() == null) {
            return Response.ok().entity(java.util.Collections.singletonMap("filename", null)).build();
        }

        return Response.ok().entity(Map.of("filename", pic.getPicture_name())).build();
    }

    @POST
    @jakarta.ws.rs.Path("/{id}/upload-profile-picture")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Authenticated
    public Response uploadProfilePicture(@PathParam("id") @jakarta.validation.constraints.Positive long id, @FormParam("file") FileUpload fileUpload) {
        logger.info("uploadProfilePicture called for user: " + id);
        User currentUser = currentUserResolver.requireCurrentUser();
        if (!currentUser.getId().equals(id)) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(java.util.Map.of("error", "Cannot upload a profile picture for another user"))
                    .build();
        }

        if (fileUpload == null || fileUpload.size() == 0 || fileUpload.size() > 5 * 1024 * 1024) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "An image file is required")).build();
        }

        Path target = null;
        try {
            ImageType type = ImageType.detect(fileUpload.uploadedFile()).orElse(null);
            if (type == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Upload a JPEG, PNG, GIF or WebP image")).build();
            }

            Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(base);
            String newFilename = "profile_" + id + "_" + UUID.randomUUID() + "." + type.extension();
            target = base.resolve(newFilename);
            Files.copy(fileUpload.uploadedFile(), target, StandardCopyOption.REPLACE_EXISTING);

            ProfilePicture picture = currentUser.getProfilePicture();
            Path previous = picture == null || picture.getPicture_name() == null
                    ? null : resolveExistingProfilePicturePath(picture.getPicture_name());
            Path uploaded = target;
            // Only remove the previous file once its replacement is committed.
            // If persistence fails, remove the new file instead.
            transactions.registerInterposedSynchronization(new Synchronization() {
                @Override
                public void beforeCompletion() {}

                @Override
                public void afterCompletion(int status) {
                    deleteProfileFile(status == Status.STATUS_COMMITTED ? previous : uploaded);
                }
            });

            if (picture == null) {
                picture = new ProfilePicture(newFilename, currentUser);
                em.persist(picture);
                currentUser.setProfilePicture(picture);
            } else {
                picture.setPicture_name(newFilename);
            }
            return Response.ok(Map.of("filename", newFilename)).build();
        } catch (IOException e) {
            deleteProfileFile(target);
            logger.error("Failed to store profile picture for user " + id, e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Failed to store profile picture")).build();
        }
    }

    private void deleteProfileFile(Path path) {
        if (path == null) return;
        try {
            Files.deleteIfExists(path);
        } catch (IOException e) {
            logger.warn("Could not remove profile picture file " + path, e);
        }
    }

    @GET
    @jakarta.ws.rs.Path("/{id}/followers")
    @Produces(MediaType.APPLICATION_JSON)
    @Authenticated
    public Response getFollowers(@PathParam("id") @jakarta.validation.constraints.Positive long id) {
        List<User> followers = followRepository.getFollowers(id);
        return Response.ok(followers.stream().map(u -> ProfileDto.from(u, false)).toList()).build();
    }

    @GET
    @jakarta.ws.rs.Path("/{id}/following")
    @Produces(MediaType.APPLICATION_JSON)
    @Authenticated
    public Response getFollowing(@PathParam("id") @jakarta.validation.constraints.Positive long id) {
        List<User> following = followRepository.getFollowing(id);
        return Response.ok(following).build();
    }

    @GET
    @jakarta.ws.rs.Path("/{id}/follow-requests")
    @Produces(MediaType.APPLICATION_JSON)
    @Authenticated
    public Response getFollowRequests(@PathParam("id") @jakarta.validation.constraints.Positive long id) {
        // Pending incoming requests are private to their recipient.
        if (currentUserResolver.requireCurrentUserId() != id) {
            return Response.status(Response.Status.FORBIDDEN).build();
        }
        return Response.ok(followRepository.getPendingFollowerRequestsWithTime(id).stream()
                .map(request -> FollowRequestDto.from(request.requester(), request.requestedAt()))
                .toList()).build();
    }

    @GET
    @jakarta.ws.rs.Path("/{userId1}/followers/{userId2}/status")
    @Produces(MediaType.APPLICATION_JSON)
    @Authenticated
    public Response getFollowStatus(@PathParam("userId1") @jakarta.validation.constraints.Positive long userId1,
                                   @PathParam("userId2") @jakarta.validation.constraints.Positive long userId2) {
        boolean following = followRepository.isFollowing(userId1, userId2);
        return Response.ok(following).build();
    }

    @POST
    @jakarta.ws.rs.Path("/{id}/follow")
    @Produces(MediaType.APPLICATION_JSON)
    @Authenticated
    public Response followUser(@PathParam("id") @jakarta.validation.constraints.Positive long id,
                               @QueryParam("targetUserId") @jakarta.validation.constraints.Positive Long targetUserId) {
        if (targetUserId == null) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        return followRepository.createFollowRequest(currentUserResolver.requireCurrentUserId(), targetUserId);
    }

    @PUT
    @jakarta.ws.rs.Path("/{id}/followers/{followerId}")
    @Produces(MediaType.APPLICATION_JSON)
    @Authenticated
    public Response acceptFollow(@PathParam("id") @jakarta.validation.constraints.Positive long id,
                                @PathParam("followerId") @jakarta.validation.constraints.Positive long followerId) {
        return followRepository.acceptFollowRequest(followerId, currentUserResolver.requireCurrentUserId());
    }

    @DELETE
    @jakarta.ws.rs.Path("/{id}/followers/{followerId}")
    @Produces(MediaType.APPLICATION_JSON)
    @Authenticated
    public Response unfollowUser(@PathParam("id") @jakarta.validation.constraints.Positive long id,
                                @PathParam("followerId") @jakarta.validation.constraints.Positive long followerId) {
        long callerId = currentUserResolver.requireCurrentUserId();
        // The follower unfollows or withdraws their own request ...
        if (callerId == followerId) {
            return followRepository.removeFollow(followerId, id);
        }
        // ... or the followed user declines a request or removes a follower.
        if (callerId == id) {
            return followRepository.removeFollow(followerId, id);
        }
        return Response.status(Response.Status.FORBIDDEN).build();
    }

    /** The caller's own relationship to {id}: "following", "pending" or "none". */
    @GET
    @jakarta.ws.rs.Path("/{id}/follow-status")
    @Produces(MediaType.APPLICATION_JSON)
    @Authenticated
    public Response getMyFollowStatus(@PathParam("id") @jakarta.validation.constraints.Positive long id) {
        long callerId = currentUserResolver.requireCurrentUserId();
        return Response.ok(Map.of("status", followRepository.followStatus(callerId, id))).build();
    }

    @GET
    @jakarta.ws.rs.Path("/{id}/media")
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response getUserMedia(@PathParam("id") @jakarta.validation.constraints.Positive long userId) {
        Long callerId = currentUserResolver.currentUserIdIfAuthenticated().orElse(null);
        return Response.ok().entity(mediaRepository.getVisibleMediaByUser(userId, callerId)).build();
    }

    @PUT
@jakarta.ws.rs.Path("/device-token")
@Transactional
@Authenticated
public Response updateDeviceToken(@QueryParam("token") @jakarta.validation.constraints.NotNull @jakarta.validation.constraints.Pattern(regexp="[a-fA-F0-9]{64}") String token) {
    Long userId = currentUserResolver.requireCurrentUserId();
    if (userId == null || token == null) return Response.status(400).build();
    
    em.createNativeQuery("UPDATE users SET device_token = :token WHERE id = :id")
      .setParameter("token", token)
      .setParameter("id", userId)
      .executeUpdate();
      
    return Response.ok().build();
}
}
