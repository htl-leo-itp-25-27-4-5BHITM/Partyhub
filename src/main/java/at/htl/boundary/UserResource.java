package at.htl.boundary;

import at.htl.model.User;
import at.htl.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.core.MediaType;

import java.io.InputStream;
import java.util.List;

@ApplicationScoped
@Path("/api/users")
public class UserResource {
    @Inject
    UserRepository userRepository;

    @GET
    @Path("/")
    public Response getUsers() {
        List<User> users = userRepository.getUsers();
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

    // new endpoint to serve profile picture by user id
    @GET
    @Path("/{id}/profile-picture")
    @Produces({"image/jpeg", "image/png", "image/gif"})
    public Response getProfilePicture(@PathParam("id") long id, @QueryParam("name") String name) {
        User user = userRepository.getUser(id);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        String profile = name;
        if (profile == null || profile.isBlank()) {
            profile = user.getProfileImage();
        }
        if (profile == null || profile.isBlank()) {
            profile = "images/profilbild1.jpg";
        }
        // normalize path to classpath resource
        String path = profile.startsWith("/") ? profile.substring(1) : profile;
        if (!path.startsWith("images/")) {
            path = "images/" + path;
        }
        InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(path);
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
    @Path("/sync")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response syncUser(UserSyncRequest req) {
        if (req == null || req.email == null || req.email.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST).entity("email required").build();
        }
        at.htl.model.User user = userRepository.findByEmail(req.email);
        if (user == null) {
            user = new at.htl.model.User();
            user.setEmail(req.email);
        }
        if (req.name != null) user.setName(req.name);
        if (req.profileImage != null && !req.profileImage.isBlank()) user.setProfileImage(req.profileImage);
        userRepository.save(user);
        return Response.ok(user).build();
    }

    public static class UserSyncRequest {
        public String name;
        public String email;
        public String profileImage;
    }
}
