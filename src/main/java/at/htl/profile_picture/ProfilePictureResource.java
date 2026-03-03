package at.htl.profile_picture;

import at.htl.user.User;
import at.htl.user.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;

@ApplicationScoped
@Path("/api/users/")
public class ProfilePictureResource {
    private static final String UPLOAD_DIR = "src/main/resources/uploads/profiles/";
    private static final String DEFAULT_IMAGE = "/META-INF/resources/images/default_profile-picture.svg";
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    @Inject
    UserRepository userRepository;
    @Inject
    Logger logger;

    @GET
    @Path("/{id}/profile-picture")
    @Produces({"image/jpeg", "image/png", "image/gif", "image/webp"})
    public Response getProfilePicture(@PathParam("id") long id) {
        User user = userRepository.getUser(id);
        if (user == null) {
            logger.log(Logger.Level.WARN, "User not found with id: " + id);
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        ProfilePicture pic = user.getProfilePicture();
        if (pic == null || pic.getPicture_name() == null) {
            logger.log(Logger.Level.DEBUG, "No profile picture for user: " + id + ", serving default");
            return serveDefaultImage();
        }

        String filename = pic.getPicture_name();
        String path = UPLOAD_DIR + filename;

        try {
            if (!Files.exists(Paths.get(path))) {
                logger.log(Logger.Level.WARN, "Profile picture file not found: " + path);
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
        return "application/octet-stream";
    }

    @GET
    @Path("/{id}/profile-picture-filename")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getProfilePictureFilename(@PathParam("id") long id) {
        User user = userRepository.getUser(id);
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
    public Response uploadProfilePicture(@PathParam("id") long id, @FormParam("file") FileUpload fileUpload) {
        if (fileUpload == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"No file provided\"}")
                    .build();
        }

        String contentType = fileUpload.contentType();
        if (!contentType.startsWith("image/")) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Only image files are allowed\"}")
                    .build();
        }

        if (fileUpload.size() > MAX_FILE_SIZE) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"File size must be less than 5MB\"}")
                    .build();
        }

        User user = userRepository.getUser(id);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"User not found\"}")
                    .build();
        }

        String oldFilename = null;
        ProfilePicture existingPic = user.getProfilePicture();
        if (existingPic != null && existingPic.getPicture_name() != null) {
            oldFilename = existingPic.getPicture_name();
        }

        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));

            String originalFilename = fileUpload.fileName();
            String fileExtension = getFileExtension(originalFilename);
            String timestamp = Instant.now().toEpochMilli() + "";
            String newFilename = "profile_" + id + "_" + timestamp + fileExtension;
            java.nio.file.Path targetLocation = Paths.get(UPLOAD_DIR, newFilename);
            Files.move(fileUpload.uploadedFile(), targetLocation);

            ProfilePicture profilePicture = new ProfilePicture(newFilename, user);
            user.setProfilePicture(profilePicture);

            if (oldFilename != null) {
                deleteOldProfilePicture(oldFilename);
            }

            logger.log(Logger.Level.INFO, "Profile picture uploaded for user " + id + ": " + newFilename);
            return Response.ok()
                    .entity("{\"message\": \"Profile picture uploaded successfully\", \"filename\": \"" + newFilename + "\"}")
                    .build();

        } catch (IOException e) {
            logger.log(Logger.Level.ERROR, "Failed to save profile picture: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Failed to save profile picture\"}")
                    .build();
        }
    }

    private void deleteOldProfilePicture(String filename) {
        try {
            java.nio.file.Path oldPath = Paths.get(UPLOAD_DIR, filename);
            if (Files.exists(oldPath)) {
                Files.delete(oldPath);
                logger.log(Logger.Level.INFO, "Deleted old profile picture: " + filename);
            }
        } catch (IOException e) {
            logger.log(Logger.Level.WARN, "Failed to delete old profile picture: " + e.getMessage());
        }
    }

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0) {
            return filename.substring(lastDotIndex);
        }
        return ".jpg";
    }
}
