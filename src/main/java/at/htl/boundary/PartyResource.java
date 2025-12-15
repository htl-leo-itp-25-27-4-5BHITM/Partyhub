package at.htl.boundary;

import at.htl.dto.FilterDto;
import at.htl.dto.PartyCreateDto;
import at.htl.repository.MediaRepository;
import at.htl.repository.PartyRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.io.IOException;

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
    public Response getSingleParty(@PathParam("id") Long id) {
        return Response.ok().entity(partyRepository.getPartyById(id)).build();
    }

    @DELETE
    @Transactional
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}")
    public Response removeParty(@PathParam("id") Long id) {
        return partyRepository.removeParty(id);
    }

    @POST
    @Transactional
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}")
    public Response updateParty(@PathParam("id") Long id, PartyCreateDto partyCreateDto) {
        return partyRepository.updateParty(id, partyCreateDto);
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("/")
    public Response filterParty(FilterDto filterDto) {
        return partyRepository.filterParty(filterDto);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/sort")
    public Response sortParty(@QueryParam("sort") String sort) {
        return partyRepository.sortParty(sort);
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Path("/{id}/attend")
    public Response attendParty(@PathParam("id") Long partyId) {
        return partyRepository.attendParty(partyId);
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Path("/{id}/attend")
    public Response unattendParty(@PathParam("id") Long partyId) {
        return partyRepository.unattendParty(partyId);
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
        return Response.ok().entity( mediaRepository.getImages(partyId)).build();
    }

    @POST
    @Path("/{id}/media/upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response upload(MediaRepository.FileUploadInput input, @PathParam("id") long partyId) throws IOException {
        return mediaRepository.upload(input, partyId);
    }
}
