package at.htl.party;

import at.htl.FilterDto;
import at.htl.media.MediaRepository;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.List;

@ApplicationScoped
@Path("/api/party")
public class PartyResource {
    @Inject
    PartyRepository partyRepository;
    @Inject
    MediaRepository mediaRepository;
    @Inject
    Logger logger;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/")
    @Transactional
    @PermitAll
    public Response getParties(@QueryParam("host_user_id") Long hostUserId) {
        if (hostUserId != null) {
            List<at.htl.party.Party> parties = partyRepository.getPartiesByHost(hostUserId);
            logger.info("Found " + parties.size() + " parties for host_user_id: " + hostUserId);
            List<PartyDto> partyDtos = parties.stream()
                .map(party -> new PartyDto(party))
                .toList();
            return Response.ok().entity(partyDtos).build();
        }
        List<at.htl.party.Party> allParties = partyRepository.getParties();
        List<PartyDto> allPartyDtos = allParties.stream()
            .map(party -> new PartyDto(party))
            .toList();
        return Response.ok().entity(allPartyDtos).build();
    }

    @POST
    @Transactional
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/add")
    @Authenticated
    public Response addParty(PartyCreateDto partyCreateDto) {
        return partyRepository.addParty(partyCreateDto);
    }

    @GET
    @Transactional
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}")
    @PermitAll
    public Response getParty(@PathParam("id") Long id) {
        Party party = partyRepository.getPartyById(id);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok().entity(party).build();
    }

    @DELETE
    @Transactional
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}")
    @Authenticated
    public Response removeParty(@PathParam("id") Long id) {
        return partyRepository.removeParty(id);
    }

    @POST
    @Transactional
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}")
    @Authenticated
    public Response updateParty(@PathParam("id") Long id, PartyCreateDto partyCreateDto) {
        return partyRepository.updateParty(id, partyCreateDto);
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/filter")
    @PermitAll
    public Response filterParty(@QueryParam("filter") String filter, FilterDto filterDto) {
        return partyRepository.filterParty(filter, filterDto);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/sort")
    @PermitAll
    public Response sortParty(@QueryParam("sort") String sort) {
        return partyRepository.sortParty(sort);
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Path("/{id}/attend")
    @Authenticated
    public Response attendParty(@PathParam("id") Long partyId) {
        return partyRepository.attendParty(partyId);
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Path("/{id}/attend")
    @Authenticated
    public Response leaveParty(@PathParam("id") Long partyId) {
        return partyRepository.leaveParty(partyId);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}/attend/status")
    @Authenticated
    public Response attendStatus(@PathParam("id") Long partyId) {
        return partyRepository.attendStatus(partyId);
    }

    @GET
    @Path("/{id}/media")
    @Produces(MediaType.APPLICATION_JSON)
    @PermitAll
    public Response getImages(@PathParam("id") long partyId) {
        return Response.ok().entity(mediaRepository.getImages(partyId)).build();
    }

    @POST
    @Path("/{id}/media/upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Authenticated
    public Response upload(MediaRepository.FileUploadInput input, @PathParam("id") long partyId) {
        return mediaRepository.upload(input, partyId);
    }

}
