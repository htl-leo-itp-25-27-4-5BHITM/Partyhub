package at.htl.boundary;

import at.htl.dto.UserCreateDto;
import at.htl.model.User;
import at.htl.repository.FollowRepository;
import at.htl.repository.MediaRepository;
import at.htl.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;

@ApplicationScoped
@Path("/api/users")
public class UserResource {
    @Inject
    UserRepository userRepository;
    @Inject
    FollowRepository followRepository;
    @Inject
    MediaRepository mediaRepository;

    @GET
    @Transactional
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/")
    public Response createUser(UserCreateDto userCreateDto) {
        return userRepository.createUser(createUserDtoToUser(userCreateDto));
    }

    private User createUserDtoToUser(UserCreateDto userCreateDto) {
        User user = new User();
        user.setDisplayName(userCreateDto.displayName());
        user.setDistinctName(userCreateDto.distinctName());
        user.setEmail(userCreateDto.email());
        user.setBiography(userCreateDto.biography());
        user.setProfileImage(userCreateDto.profilePicture());
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

    @GET
    @Path("/{id}/media/count")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getMediaCount(@PathParam("id") long id) {
        User user = userRepository.getUser(id);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        long count = mediaRepository.getMediaCountByUserId(id);
        return Response.ok().entity("{\"count\": " + count + "}").build();
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateUser(@PathParam("id") long id, UserCreateDto userCreateDto) {
        return userRepository.updateUser(id, userCreateDto);
    }

    @GET
    @Path("/{id}/profile-picture")
    @Produces({"image/jpeg", "image/png", "image/gif"})
    public Response getProfilePicture(@PathParam("id") long id) {
        User user = userRepository.getUser(id);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        String pic = user.getProfileImage();

        // Handle both old images/ path and new uploads/ path
        String path;
        if (pic != null && pic.startsWith("uploads/")) {
            // New uploaded files
            path = "src/main/resources/" + pic;
            try {
                InputStream is = Files.newInputStream(Paths.get(path));
                String lower = pic.toLowerCase();
                String type = "application/octet-stream";
                if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) type = "image/jpeg";
                else if (lower.endsWith(".png")) type = "image/png";
                else if (lower.endsWith(".gif")) type = "image/gif";
                return Response.ok(is, type).build();
            } catch (IOException e) {
                // Fall back to default image
            }
        }

        // Handle old classpath resources
        path = pic != null && pic.startsWith("/") ? pic.substring(1) : (pic != null ? pic : "images/default_profile-picture.jpg");
        if (!path.startsWith("images/")) {
            path = "images/" + path;
        }
        InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(path);
        if (is == null) {
            // Fall back to default image
            is = Thread.currentThread().getContextClassLoader().getResourceAsStream("images/default_profile-picture.jpg");
        }
        if (is == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        String lower = path.toLowerCase();
        String type = "application/octet-stream";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) type = "image/jpeg";
        else if (lower.endsWith(".png")) type = "image/png";
        else if (lower.endsWith(".gif")) type = "image/gif";

        return Response.ok(is, type).build();
    }

    @POST
    @Path("/{id}/upload-profile-picture")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response uploadProfilePicture(@PathParam("id") long id, @FormParam("file") FileUpload fileUpload) {
        if (fileUpload == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"No file provided\"}")
                    .build();
        }

        // Validate file type
        String contentType = fileUpload.contentType();
        if (!contentType.startsWith("image/")) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Only image files are allowed\"}")
                    .build();
        }

        // Validate file size (max 5MB)
        if (fileUpload.size() > 5 * 1024 * 1024) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"File size must be less than 5MB\"}")
                    .build();
        }

        // Check if user exists
        User user = userRepository.getUser(id);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"User not found\"}")
                    .build();
        }

        try {
            // Create uploads/profiles directory if it doesn't exist
            String uploadDir = "src/main/resources/uploads/profiles/";
            Files.createDirectories(Paths.get(uploadDir));

            // Generate unique filename
            String originalFilename = fileUpload.fileName();
            String fileExtension = getFileExtension(originalFilename);
            String timestamp = Instant.now().toEpochMilli() + "";
            String newFilename = "profile_" + id + "_" + timestamp + fileExtension;

            // Move uploaded file to target location
            java.nio.file.Path targetLocation = Paths.get(uploadDir, newFilename);
            Files.move(fileUpload.uploadedFile(), targetLocation);

            // Update user's profile image in database
            user.setProfileImage("uploads/profiles/" + newFilename);
            userRepository.updateUser(id, new UserCreateDto(
                    user.getDisplayName(),
                    user.getDistinctName(),
                    user.getEmail(),
                    user.getBiography(),
                    user.getProfileImage()
            ));

            return Response.ok()
                    .entity("{\"message\": \"Profile picture uploaded successfully\", \"filename\": \"" + newFilename + "\"}")
                    .build();

        } catch (IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Failed to save profile picture\"}")
                    .build();
        }
    }

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0) {
            return filename.substring(lastDotIndex);
        }
        return ".jpg"; // default extension
    }
}