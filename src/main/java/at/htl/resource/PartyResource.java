package at.htl.resource;

import at.htl.model.Party;
import at.htl.repository.PartyRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

@ApplicationScoped
@Path("/api/party")
public class PartyResource {

    @Inject
    EntityManager entityManager;

    @Inject
    Logger logger;

    @Inject
    PartyRepository partyRepository;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/")
    @Transactional
    public Response getParties() {
        return partyRepository.getParties();
    }

    @POST
    @Transactional
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/add")
    public Response addParty(Party party) {
        return partyRepository.addParty(party);
    }
    @GET
    @Transactional
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}")
    public Response getSingleParty(@PathParam("id") Long id) {
        return partyRepository.getPartyById(id);
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
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Path("/filter")
    public Response filterParty(@QueryParam("filter") String filterType, @FormParam("param") String filterParam) {
        return partyRepository.filterParty(filterType, filterParam);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/sort")
    public Response sortParty(@QueryParam("sort") String sort) {
        return partyRepository.sortParty(sort);
    }
}
