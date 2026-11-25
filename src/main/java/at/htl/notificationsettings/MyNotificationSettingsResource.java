package at.htl.notificationsettings;

import at.htl.auth.CurrentUserResolver;
import at.htl.user.User;
import io.quarkus.security.Authenticated;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

/** The caller's own notification settings (settings page). */
@Path("/api/me/notification-settings")
@ApplicationScoped
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
public class MyNotificationSettingsResource {

    @Inject
    UserNotificationSettingsRepository repository;

    @Inject
    CurrentUserResolver currentUserResolver;

    @GET
    public NotificationSettingsDto get() {
        User user = currentUserResolver.requireCurrentUser();
        // A legacy profile without a row gets the documented defaults.
        return NotificationSettingsDto.from(repository.findByUserId(user.getId())
                .orElseGet(() -> new UserNotificationSettings(user)));
    }

    @PUT
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional
    public NotificationSettingsDto update(
            @Valid @NotNull(message = "Notification settings are required") NotificationSettingsDto dto) {
        User user = currentUserResolver.requireCurrentUser();
        UserNotificationSettings settings = repository.findByUserId(user.getId()).orElseGet(() -> {
            UserNotificationSettings created = new UserNotificationSettings(user);
            repository.persist(created);
            return created;
        });
        dto.applyTo(settings);
        return NotificationSettingsDto.from(settings);
    }
}
