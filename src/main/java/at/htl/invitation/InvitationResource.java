package at.htl.invitation;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/invitations")
@ApplicationScoped
public class InvitationResource {
    @Inject
    InvitationRepository invitationRepository;

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response createInvitation(InvitationDto invitationDto,
                                      @QueryParam("user") Long userId,
                                      @HeaderParam("X-User-Id") Long headerUserId) {
        Long actualUserId = userId != null ? userId : headerUserId;
        return invitationRepository.invite(invitationDto, actualUserId);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getInvitations(
            @QueryParam("direction") String direction,
            @QueryParam("user") Long userId,
            @HeaderParam("X-User-Id") Long headerUserId) {
        Long actualUserId = userId != null ? userId : headerUserId;
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
    public Response deleteInvitation(@PathParam("id") Long id,
                                     @QueryParam("user") Long userId,
                                     @HeaderParam("X-User-Id") Long headerUserId) {
        Long actualUserId = userId != null ? userId : headerUserId;
        return invitationRepository.deleteInvite(id, actualUserId);
    }
}
