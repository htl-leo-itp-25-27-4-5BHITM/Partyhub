package at.htl.user;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

@ApplicationScoped
@Path("/api/user-context")
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
        return Response.ok(Map.of(
                "userId", userContext.getCurrentUserId()
        )).build();
    }

    @POST
    @Path("/switch/{userId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response switchUser(@PathParam("userId") Long userId) {
        try {
            userContext.setCurrentUserId(userId);
            User user = userContext.getCurrentUser();
            return Response.ok(Map.of(
                    "message", "User switched successfully",
                    "userId", userId,
                    "displayName", user.getDisplayName(),
                    "distinctName", user.getDistinctName()
            )).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
    @POST
    @Path("/switch-by-name/{distinctName}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response switchUserByName(@PathParam("distinctName") String distinctName) {
        User user = userRepository.findByDistinctName(distinctName);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "User with distinct name '" + distinctName + "' not found"))
                    .build();
        }

        try {
            userContext.setCurrentUserId(user.getId());
            return Response.ok(Map.of(
                    "message", "User switched successfully",
                    "userId", user.getId(),
                    "displayName", user.getDisplayName(),
                    "distinctName", user.getDistinctName()
            )).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/reset")
    @Produces(MediaType.APPLICATION_JSON)
    public Response resetToDefault() {
        userContext.resetToDefault();
        User user = userContext.getCurrentUser();
        return Response.ok(Map.of(
                "message", "User context reset to default",
                "userId", user.getId(),
                "displayName", user.getDisplayName(),
                "distinctName", user.getDistinctName()
        )).build();
    }
}
