package at.htl.party;

import at.htl.FilterDto;
import at.htl.media.MediaRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@ApplicationScoped
@Path("/api/party")
public class PartyResource {
    @Inject
    PartyRepository partyRepository;
    @Inject
    MediaRepository mediaRepository;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/")
    @Transactional
    public Response getParties() {
        return Response.ok().entity( partyRepository.getParties()).build();
    }

    @POST
    @Transactional
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/add")
    public Response addParty(PartyCreateDto partyCreateDto) {
        return partyRepository.addParty(partyCreateDto);
    }

    @GET
    @Transactional
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}")
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
    public Response removeParty(@PathParam("id") Long id) {
        return partyRepository.removeParty(id);
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Path("/{id}")
    public Response updateParty(@PathParam("id") Long id, PartyCreateDto partyCreateDto) {
        if (partyCreateDto == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Payload missing").build();
        }
        return partyRepository.updateParty(id, partyCreateDto);
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/filter")
    public Response filterParty(@QueryParam("filter") String filter, FilterDto req) {
        // HTTP-Ebene: Sind die Parameter da?
        if (filter == null || filter.isBlank()) {
            return Response.status(400).entity("Query-Parameter 'filter' fehlt.").build();
        }
        if (req == null) {
            return Response.status(400).entity("Request-Body (FilterDto) fehlt.").build();
        }

        // Delegation an Repository
        List<Party> result = switch (filter.toLowerCase()) {
            case "content"  -> (req.value() != null) ? partyRepository.findByTitleOrDescription(req.value()) : null;
            case "category" -> (req.value() != null) ? partyRepository.findByCategory(req.value()) : null;
            case "date"     -> (req.start() != null && req.end() != null) ? partyRepository.findByDateRange(req.start(), req.end()) : null;
            default         -> null;
        };

        if (result == null) {
            return Response.status(400).entity("Fehler: Ungültiger Filter oder unvollständige Daten.").build();
        }

        return Response.ok(result).build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/sort")
    public Response sortParty(@QueryParam("sort") String sort) {
        return partyRepository.sortParty(sort);
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}/attend")
    public Response attendParty(@PathParam("id") Long partyId) {
        return partyRepository.attendParty(partyId);
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Path("/{id}/attend")
    public Response leaveParty(@PathParam("id") Long partyId) {
        return partyRepository.leaveParty(partyId);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}/attend/status")
    public Response attendStatus(@PathParam("id") Long partyId) {
        return partyRepository.attendStatus(partyId);
    }

    @GET
    @Path("/{id}/media")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getImages(@PathParam("id") long partyId) {
        return Response.ok().entity(mediaRepository.getImages(partyId)).build();
    }

    @POST
    @Path("/{id}/media/upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response upload(MediaRepository.FileUploadInput input, @PathParam("id") long partyId) {
        return mediaRepository.upload(input, partyId);
    }
}
