package at.htl.profile_picture;

import at.htl.media.Media;
import at.htl.user.User;
import at.htl.user.UserCreateDto;
import at.htl.user.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.Entity;
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

@ApplicationScoped
@Path("/api/users/")
public class ProfilePictureResource {
    @Inject
    UserRepository userRepository;

    @GET
    @Path("/{id}/profile-picture")
    @Produces({"image/jpeg", "image/png", "image/gif"})
    public Response getProfilePicture(@PathParam("id") long id) {
        User user = userRepository.getUser(id);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        ProfilePicture pic = user.getProfilePicture();
        String path;
        path = "src/main/resources/uploads/profiles/" + pic;
        try {
            InputStream is = Files.newInputStream(Paths.get(path));
            String lower = pic.getPicture_name().toLowerCase();
            String type = "application/octet-stream";
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) type = "image/jpeg";
            else if (lower.endsWith(".png")) type = "image/png";
            else if (lower.endsWith(".gif")) type = "image/gif";
            return Response.ok(is, type).build();
        } catch (IOException e) {
        }
        return Response.status(Response.Status.NOT_FOUND).build();
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
        if (fileUpload.size() > 5 * 1024 * 1024) {
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
        try {
            String uploadDir = "src/main/resources/uploads/profiles/";
            Files.createDirectories(Paths.get(uploadDir));
            String originalFilename = fileUpload.fileName();
            String fileExtension = getFileExtension(originalFilename);
            String timestamp = Instant.now().toEpochMilli() + "";
            String newFilename = "profile_" + id + "_" + timestamp + fileExtension;
            java.nio.file.Path targetLocation = Paths.get(uploadDir, newFilename);
            Files.move(fileUpload.uploadedFile(), targetLocation);

            ProfilePicture profilePicture = new ProfilePicture(newFilename, user);
            user.setProfilePicture(profilePicture);


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
        return ".jpg";
    }
}
