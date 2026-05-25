package at.htl.party;

import java.util.List;
import java.util.Map;

import at.htl.FilterDto;
import at.htl.auth.CurrentUserResolver;
import at.htl.media.MediaRepository;
import at.htl.user_location.UserLocationRepository;
import io.quarkus.security.Authenticated;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
@Path("/api/parties")
public class PartyResource {

    @Inject
    PartyRepository partyRepository;

    @Inject
    MediaRepository mediaRepository;

    @Inject
    UserLocationRepository userLocationRepository;

    @Inject
    CurrentUserResolver currentUserResolver;

    @Inject
    EntityManager em;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("")
    @Transactional
    public Response getParties(
            @QueryParam("q") String q,
            @QueryParam("theme") String theme,
            @QueryParam("date_from") String dateFrom,
            @QueryParam("date_to") String dateTo,
            @QueryParam("sort") String sort,
            @QueryParam("user_age") Integer userAge,
            @QueryParam("free") Boolean free,
            @QueryParam("user_latitude") Double userLatitude,
            @QueryParam("user_longitude") Double userLongitude,
            @QueryParam("distance") Integer distanceKm,
            @QueryParam("limit") Integer limit,
            @QueryParam("offset") Integer offset) {
        
        Long actualUserId = currentUserResolver.currentUserIdIfAuthenticated().orElse(null);

        boolean hasNewFilters = (userAge != null) ||
                               (free != null) ||
                               (userLatitude != null && userLongitude != null);

        if (hasNewFilters) {
            try {
                FilterParams filters = new FilterParams(q, theme, userAge, free, userLatitude, userLongitude, distanceKm, limit, offset);
                List<Party> result = partyRepository.findWithFilters(filters, actualUserId);
                return Response.ok(result).build();
            } catch (IllegalArgumentException e) {
                return Response.status(400).entity("{\"error\": \"" + e.getMessage() + "\"}").build();
            }
        }

        boolean hasLegacyFilters = (q != null && !q.isBlank()) ||
                                  (theme != null && !theme.isBlank()) ||
                                  (dateFrom != null && !dateFrom.isBlank()) ||
                                  (dateTo != null && !dateTo.isBlank());
        
        if (hasLegacyFilters) {
            List<Party> result = null;
            if (q != null && !q.isBlank()) {
                result = partyRepository.findByTitleOrDescription(q);
            } else if (theme != null && !theme.isBlank()) {
                result = partyRepository.findByTheme(theme);
            } else if (dateFrom != null && dateTo != null) {
                result = partyRepository.findByDateRange(dateFrom, dateTo);
            }
            
            if (result == null) {
                return Response.status(400).entity("Invalid filter or incomplete data").build();
            }
            return Response.ok(result).build();
        }
        
        if (sort != null && !sort.isBlank()) {
            return partyRepository.sortParty(sort);
        }
        
        return Response.ok().entity(partyRepository.getPartiesByUser(actualUserId)).build();
    }

    @POST
    @Transactional
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("")
    @Authenticated
    public Response createParty(@Valid PartyCreateDto partyCreateDto) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return partyRepository.addParty(partyCreateDto, actualUserId);
    }

    @GET
    @Transactional
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}")
    public Response getParty(
            @PathParam("id") Long id) {
        Long actualUserId = currentUserResolver.currentUserIdIfAuthenticated().orElse(null);
        Party party = partyRepository.getPartyByIdIfVisible(id, actualUserId);

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

    @PUT
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional
    @Path("/{id}")
    @Authenticated
    public Response updatePartyPut(@PathParam("id") Long id,
                                   @Valid PartyCreateDto partyCreateDto) {
        if (partyCreateDto == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Payload missing\"}")
                    .build();
        }
        
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return partyRepository.updateParty(id, partyCreateDto, actualUserId);
    }

    @PUT
    @Path("/device-token")
    @Transactional
    @Authenticated
    public Response updateToken(@QueryParam("token") String token) {
        Long userId = currentUserResolver.requireCurrentUserId();
        if (userId == null || token == null) {
            return Response.status(400).entity("User ID or Token missing").build();
        }
        
        em.createNativeQuery("UPDATE users SET device_token = :token WHERE id = :id")
          .setParameter("token", token)
          .setParameter("id", userId)
          .executeUpdate();
          
        return Response.ok().build();
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}/join")
    @Authenticated
    public Response joinParty(@PathParam("id") Long partyId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return partyRepository.attendParty(partyId, actualUserId);
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Path("/{id}/join")
    @Authenticated
    public Response leaveParty(@PathParam("id") Long partyId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return partyRepository.leaveParty(partyId, actualUserId);
    }
    
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}/join/status")
    @Authenticated
    public Response joinStatus(@PathParam("id") Long partyId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return partyRepository.attendStatus(partyId, actualUserId);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}/invited-members")
    @Authenticated
    public Response invitedMembers(@PathParam("id") Long partyId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return partyRepository.getInvitedMembers(partyId, actualUserId);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}/joined-members")
    @Authenticated
    public Response joinedMembers(@PathParam("id") Long partyId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return partyRepository.getJoinedMembers(partyId, actualUserId);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}/invitation-stats")
    @Authenticated
    public Response invitationStats(@PathParam("id") Long partyId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        InvitationStatsDto stats = partyRepository.getInvitationStats(partyId, actualUserId);
        if (stats == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(stats).build();
    }

    @POST
    @Path("/{partyId}/media/upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Authenticated
    public Response upload(MediaRepository.FileUploadInput input,
                           @PathParam("partyId") long partyId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();

        if (actualUserId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"User ID required\"}")
                    .build();
        }
        return mediaRepository.upload(input, partyId, actualUserId);
    }

    @GET
    @Path("/{id}/can-edit")
    @Produces(MediaType.APPLICATION_JSON)
    @Authenticated
    public Response canEditParty(@PathParam("id") Long partyId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();

        if (actualUserId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "User ID required"))
                    .build();
        }

        Party party = em.find(Party.class, partyId);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Party not found"))
                    .build();
        }

        boolean canEdit = party.getHost_user() != null &&
                party.getHost_user().getId().equals(actualUserId);

        return Response.ok(Map.of(
                "canEdit", canEdit,
                "role", canEdit ? "owner" : "attendee",
                "partyId", partyId,
                "userId", actualUserId
        )).build();
    }

    @GET
    @Path("/{id}/locations")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getPartyLocations(@PathParam("id") Long partyId) {
        Party party = em.find(Party.class, partyId);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(userLocationRepository.getLocationsByPartyId(partyId)).build();
    }

    @GET
    @Path("/{id}/media")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getPartyMedia(@PathParam("id") Long partyId) {
        Party party = em.find(Party.class, partyId);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok().entity(mediaRepository.getMediaByParty(partyId)).build();
    }
}
