package at.htl.model;

import at.htl.control.PartyRepository;
import at.htl.entity.*;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.NoCache;

import java.io.IOException;

import java.time.LocalDateTime;

import java.util.List;

@ApplicationScoped
@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ApiResource {

    @Inject
    JsonWebToken jwt;



    @Inject
    PartyRepository partyRepo;

    @GET
    @Path("/users/me")
    @NoCache
    public User me() {
        return new User(jwt);
    }

    @GET
    @Path("/users")
    public List<User> getUsers() {
        return partyRepo.getUsers();
    }

    @GET
    @Path("/categories")
    public List<Category> getCategory() {
        return partyRepo.getCategory();
    }

    @GET
    @Path("/users/{id}")
    public User getUser(@PathParam("id") long id) {
        return partyRepo.getUser(id);
    }

    @GET
    @Path("/media/{party}")
    public List<Media> getImages(@PathParam("party") long partyId) {
        return partyRepo.getImages(partyId);
            }

    @POST
    @Path("/media/upload/{partyId}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response upload(PartyRepository.FileUploadInput input, @PathParam("partyId") long partyId) throws IOException {
        return partyRepo.upload(input, partyId);
    }

    @POST
    @Transactional
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/party/add")
    public Response addParty(@FormParam("category_id") Long category_id, @FormParam("time_start") LocalDateTime start, @FormParam("time_end") LocalDateTime end, @FormParam("max_people") int max_people, @FormParam("min_age") int min_age, @FormParam("max_age") int max_age) {
        return partyRepo.addParty(category_id, start, end, max_people, min_age, max_age);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Path("/party")
    public Response getParties() {
        return partyRepo.getParties();

    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Path("/party/filter")
    public List<Party> filterParty(@QueryParam("filter") String filterType, @FormParam("param") String filterParam) {
        return partyRepo.filterParty(filterType, filterParam);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/party/sort")
    public List<Party> sortParty(@QueryParam("sort") String sort) {
        return partyRepo.sortParty(sort);
    }

    @POST
    @Transactional
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/party/attend/{id}/{user}")
    public Response attendParty(@PathParam("id") Long party_id, @PathParam("user") User user) {
        return partyRepo.attendParty(party_id, user);
    }

    @PUT
    @Path("/party/{id}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateParty(
            @PathParam("id") Long partyId,
            @FormParam("category_id") Long categoryId,
            @FormParam("time_start") LocalDateTime start,
            @FormParam("time_end") LocalDateTime end,
            @FormParam("max_people") Integer maxPeople,
            @FormParam("min_age") Integer minAge,
            @FormParam("max_age") Integer maxAge,
            @FormParam("title") String title,
            @FormParam("description") String description
    ) {
        return partyRepo.updateParty(partyId, categoryId, start, end, maxPeople, minAge, maxAge, title, description);

    }
}
