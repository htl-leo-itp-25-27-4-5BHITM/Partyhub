package at.htl.invitation;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/invites")
@ApplicationScoped
public class InvitationResource {
    @Inject
    InvitationRepository invitationRepository;

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Path("/")
    public Response invite(InvitationDto invitationDto){
        return invitationRepository.invite(invitationDto);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/rec")
    public Response getReceivedInvites(){
        return Response.ok().entity(invitationRepository.getReceivedInvites()).build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/inv")
    public Response getSentInvites(){
        return Response.ok().entity(invitationRepository.getSentInvites()).build();
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Path("/delete/{id}")
    public Response deleteInvite(@PathParam("id") Long id){
        return invitationRepository.deleteInvite(id);
    }
}
