package at.htl.user;

import io.quarkus.security.Authenticated;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

@ApplicationScoped
@Path("/api/user-context")
@Authenticated
public class UserContextResource {

    @Inject
    UserContext userContext;

    @Inject
    UserRepository userRepository;

    @GET
    @Path("/current")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCurrentUser() {
        User user = userContext.getCurrentUser();
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Current user not found"))
                    .build();
        }
        return Response.ok(user).build();
    }

    @GET
    @Path("/current/id")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCurrentUserId() {
        Long userId = userContext.getCurrentUserId();
        if (userId == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Current user not found"))
                    .build();
        }
        return Response.ok(Map.of("userId", userId)).build();
    }

    @GET
    @Path("/me")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getMe() {
        User user = userContext.getCurrentUser();
        if (user == null) {
            String email = userContext.getCurrentUserEmail();
            String name = userContext.getCurrentUserName();
            return Response.ok(Map.of(
                    "authenticated", true,
                    "email", email != null ? email : "",
                    "name", name != null ? name : "",
                    "linked", false,
                    "message", "User is authenticated but not linked to a PartyHub account"
            )).build();
        }
        
        return Response.ok(Map.of(
                "authenticated", true,
                "linked", true,
                "user", user
        )).build();
    }
}
