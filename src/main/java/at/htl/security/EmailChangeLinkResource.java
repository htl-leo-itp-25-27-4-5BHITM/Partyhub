package at.htl.security;

import at.htl.security.EmailChangeDtos.EmailChangeTokenDto;
import at.htl.security.EmailChangeDtos.NotMeResultDto;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * Targets of the links in the e-mail change mails. They work without login: the single-use,
 * expiring link token is the authorisation (the recipient of the old address may not be able
 * to log in anymore).
 */
@Path("/api/email-change")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EmailChangeLinkResource {

    @Inject
    EmailChangeService service;

    @POST
    @Path("/confirm")
    @Transactional
    public Response confirm(@Valid @NotNull(message = "The link is incomplete") EmailChangeTokenDto dto) {
        service.confirm(dto.token());
        return Response.noContent().build();
    }

    @POST
    @Path("/not-me")
    @Transactional
    public NotMeResultDto notMe(@Valid @NotNull(message = "The link is incomplete") EmailChangeTokenDto dto) {
        return new NotMeResultDto(service.reportNotMe(dto.token()));
    }
}
