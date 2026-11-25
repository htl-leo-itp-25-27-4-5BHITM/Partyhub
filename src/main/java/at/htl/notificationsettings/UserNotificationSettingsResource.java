package at.htl.notificationsettings;

import at.htl.auth.CurrentUserResolver;
import io.quarkus.security.Authenticated;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/** Older address of the notification settings, kept for existing clients; same rules as /api/me. */
@Path("/api/users/{id}/notification-settings")
@ApplicationScoped
@Authenticated
public class UserNotificationSettingsResource {

    @Inject
    MyNotificationSettingsResource own;

    @Inject
    CurrentUserResolver currentUserResolver;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getSettings(@PathParam("id") Long userId) {
        if (!currentUserResolver.requireCurrentUserId().equals(userId)) {
            return Response.status(Response.Status.FORBIDDEN).build();
        }
        return Response.ok(own.get()).build();
    }

    @PUT
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response updateSettings(@PathParam("id") Long userId,
                                   @Valid @NotNull(message = "Notification settings are required") NotificationSettingsDto dto) {
        if (!currentUserResolver.requireCurrentUserId().equals(userId)) {
            return Response.status(Response.Status.FORBIDDEN).build();
        }
        return Response.ok(own.update(dto)).build();
    }
}
