package at.htl.notificationsettings;

import at.htl.auth.CurrentUserResolver;
import io.quarkus.security.Authenticated;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/users/{id}/notification-settings")
@ApplicationScoped
public class UserNotificationSettingsResource {

    @Inject
    UserNotificationSettingsRepository repository;

    @Inject
    CurrentUserResolver currentUserResolver;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Authenticated
    public Response getSettings(@PathParam("id") Long userId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        if (!actualUserId.equals(userId)) {
            return Response.status(Response.Status.FORBIDDEN).build();
        }

        return repository.findByUserId(userId)
                .map(settings -> Response.ok(NotificationSettingsDto.from(settings)).build())
                .orElse(Response.status(Response.Status.NOT_FOUND).build());
    }

    @PUT
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Authenticated
    public Response updateSettings(@PathParam("id") Long userId, NotificationSettingsDto dto) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        if (!actualUserId.equals(userId)) {
            return Response.status(Response.Status.FORBIDDEN).build();
        }

        UserNotificationSettings settings = repository.findByUserId(userId)
                .orElse(null);
        if (settings == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        settings.setEmailEnabled(dto.emailEnabled());
        settings.setPushEnabled(dto.pushEnabled());
        settings.setSmsEnabled(dto.smsEnabled());
        settings.setInAppEnabled(dto.inAppEnabled());
        settings.setPartyInvites(dto.partyInvites());
        settings.setPartyUpdates(dto.partyUpdates());
        settings.setFollowEvents(dto.followEvents());

        repository.save(settings);
        return Response.ok(NotificationSettingsDto.from(settings)).build();
    }
}
