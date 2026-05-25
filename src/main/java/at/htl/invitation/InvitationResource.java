package at.htl.invitation;

import at.htl.auth.CurrentUserResolver;
import io.quarkus.security.Authenticated;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/invitations")
@ApplicationScoped
public class InvitationResource {
    @Inject
    InvitationRepository invitationRepository;
    @Inject
    CurrentUserResolver currentUserResolver;

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Authenticated
    public Response createInvitation(@Valid InvitationDto invitationDto) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return invitationRepository.invite(invitationDto, actualUserId);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Authenticated
    public Response getInvitations(@QueryParam("direction") String direction) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        if (actualUserId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"User ID required\"}")
                    .build();
        }
        
        if ("sent".equalsIgnoreCase(direction)) {
            return Response.ok().entity(invitationRepository.getSentInvites(actualUserId)).build();
        }
        return Response.ok().entity(invitationRepository.getReceivedInvites(actualUserId)).build();
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Path("/{id}")
    @Authenticated
    public Response deleteInvitation(@PathParam("id") Long id) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return invitationRepository.deleteInvite(id, actualUserId);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}/details")
    @Authenticated
    public Response getInvitationDetails(@PathParam("id") Long id) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return invitationRepository.getInvitationDetails(id, actualUserId);
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Path("/{id}/accept")
    @Authenticated
    public Response acceptInvitation(@PathParam("id") Long id) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return invitationRepository.acceptInvite(id, actualUserId);
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Path("/{id}/decline")
    @Authenticated
    public Response declineInvitation(@PathParam("id") Long id) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return invitationRepository.declineInvite(id, actualUserId);
    }
}
