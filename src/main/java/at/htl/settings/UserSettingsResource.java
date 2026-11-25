package at.htl.settings;

import at.htl.auth.CurrentUserResolver;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

/** The caller's own account preferences; there is no way to address another user. */
@Path("/api/me/settings")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
public class UserSettingsResource {

    @Inject
    UserSettingsRepository repository;

    @Inject
    CurrentUserResolver currentUserResolver;

    @GET
    public UserSettingsDto get() {
        return repository.findByUserId(currentUserResolver.requireCurrentUserId())
                .map(UserSettingsDto::from)
                .orElseGet(UserSettingsDto::defaults);
    }

    @PUT
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional
    public UserSettingsDto update(@Valid @NotNull(message = "Settings are required") UserSettingsDto dto) {
        return UserSettingsDto.from(repository.save(currentUserResolver.requireCurrentUserId(), dto));
    }
}
