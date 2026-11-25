package at.htl.security;

import at.htl.auth.CurrentUserResolver;
import at.htl.security.EmailChangeDtos.EmailChangeCreateDto;
import at.htl.security.EmailChangeDtos.PendingEmailChangeDto;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/** The caller's own e-mail change: start, resend, cancel and read the pending state. */
@Path("/api/me/email-change")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
public class EmailChangeResource {

    @Inject
    EmailChangeService service;

    @Inject
    CurrentUserResolver currentUserResolver;

    @Inject
    ReauthPolicy reauthPolicy;

    @GET
    public PendingEmailChangeDto pending() {
        return service.pending(currentUserResolver.requireCurrentUserId())
                .map(PendingEmailChangeDto::from)
                .orElseGet(PendingEmailChangeDto::none);
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional
    public Response request(@Valid @NotNull(message = "Enter your new e-mail address") EmailChangeCreateDto dto,
                            @HeaderParam("User-Agent") String userAgent) {
        if (!reauthPolicy.recentlyAuthenticated()) {
            throw new EmailChangeProblem(Response.Status.UNAUTHORIZED, "REAUTH_REQUIRED",
                    "Please confirm your current password first");
        }
        EmailChangeService.Pending pending = service.request(currentUserResolver.requireCurrentUser(), dto.newEmail(), userAgent);
        return Response.status(Response.Status.CREATED).entity(PendingEmailChangeDto.from(pending)).build();
    }

    @POST
    @Path("/resend")
    @Transactional
    public PendingEmailChangeDto resend() {
        return PendingEmailChangeDto.from(service.resend(currentUserResolver.requireCurrentUser()));
    }

    @DELETE
    @Transactional
    public Response cancel() {
        service.cancel(currentUserResolver.requireCurrentUser());
        return Response.noContent().build();
    }
}
