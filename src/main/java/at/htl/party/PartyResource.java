package at.htl.party;

import java.util.List;
import java.util.Map;

import at.htl.auth.CurrentUserResolver;
import at.htl.media.FileUploadInput;
import at.htl.media.MediaRepository;
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
    CurrentUserResolver currentUserResolver;

    @Inject
    EntityManager em;

    @Inject
    PartySocialService partySocialService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("")
    @Transactional
    public Response getParties(
            @QueryParam("q") String q,
            @QueryParam("theme") String theme,
            @QueryParam("date_from") @jakarta.validation.constraints.Size(max=32) String dateFrom,
            @QueryParam("date_to") @jakarta.validation.constraints.Size(max=32) String dateTo,
            @QueryParam("sort") @jakarta.validation.constraints.Pattern(regexp="(?i)asc|desc") String sort,
            @QueryParam("user_age") Integer userAge,
            @QueryParam("free") Boolean free,
            @QueryParam("user_latitude") Double userLatitude,
            @QueryParam("user_longitude") Double userLongitude,
            @QueryParam("distance") Integer distanceKm,
            @QueryParam("limit") Integer limit,
            @QueryParam("offset") Integer offset,
            @QueryParam("include_past") Boolean includePast) {
        
        Long actualUserId = currentUserResolver.currentUserIdIfAuthenticated().orElse(null);

        if (userLatitude != null && userLongitude == null) {
            return Response.status(400).entity(java.util.Map.of("error", "user_longitude is required when user_latitude is provided")).build();
        }
        if (userLongitude != null && userLatitude == null) {
            return Response.status(400).entity(java.util.Map.of("error", "user_latitude is required when user_longitude is provided")).build();
        }
        if (distanceKm != null && distanceKm < 0) {
            return Response.status(400).entity(java.util.Map.of("error", "distance must be a positive number")).build();
        }
        if (distanceKm != null && (userLatitude == null || userLongitude == null)) {
            return Response.status(400).entity(java.util.Map.of("error", "user_latitude and user_longitude are required for distance filter")).build();
        }

        try {
            FilterParams filters = new FilterParams(q, theme, userAge, free, userLatitude, userLongitude, distanceKm, limit, offset);
            List<Party> parties = partyRepository.findVisibleParties(filters, actualUserId, dateFrom, dateTo, sort,
                    Boolean.TRUE.equals(includePast) && actualUserId != null);
            partySocialService.enrichVisibleParties(parties, actualUserId, false);
            return Response.ok(parties).header("Cache-Control", "private, no-store").build();
        } catch (IllegalArgumentException | java.time.DateTimeException e) {
            return at.htl.validation.InputExceptionMappers.invalid();
        }
    }

    @POST
    @Transactional
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("")
    @Authenticated
    public Response createParty(@jakarta.validation.constraints.NotNull @Valid @jakarta.validation.groups.ConvertGroup(from=jakarta.validation.groups.Default.class, to=at.htl.validation.OnCreate.class) PartyCreateDto partyCreateDto) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return partyRepository.addParty(partyCreateDto, actualUserId);
    }

    @GET
    @Transactional
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}")
    public Response getParty(
            @PathParam("id") @jakarta.validation.constraints.Positive Long id) {
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
    @Authenticated
    public Response removeParty(@PathParam("id") @jakarta.validation.constraints.Positive Long id) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return partyRepository.removeParty(id, actualUserId);
    }

    @PUT
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional
    @Path("/{id}")
    @Authenticated
    public Response updatePartyPut(@PathParam("id") @jakarta.validation.constraints.Positive Long id,
                                   @jakarta.validation.constraints.NotNull @Valid PartyCreateDto partyCreateDto) {
        if (partyCreateDto == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(java.util.Map.of("error", "Payload missing"))
                    .build();
        }
        
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return partyRepository.updateParty(id, partyCreateDto, actualUserId);
    }

    @PUT
    @Path("/device-token")
    @Transactional
    @Authenticated
    public Response updateToken(@QueryParam("token") @jakarta.validation.constraints.NotNull @jakarta.validation.constraints.Pattern(regexp="[a-fA-F0-9]{64}") String token) {
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
    public Response joinParty(@PathParam("id") @jakarta.validation.constraints.Positive Long partyId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return partyRepository.attendParty(partyId, actualUserId);
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Path("/{id}/join")
    @Authenticated
    public Response leaveParty(@PathParam("id") @jakarta.validation.constraints.Positive Long partyId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return partyRepository.leaveParty(partyId, actualUserId);
    }
    
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}/join/status")
    @Authenticated
    public Response joinStatus(@PathParam("id") @jakarta.validation.constraints.Positive Long partyId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return partyRepository.attendStatus(partyId, actualUserId);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}/invited-members")
    @Authenticated
    public Response invitedMembers(@PathParam("id") @jakarta.validation.constraints.Positive Long partyId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return partyRepository.getInvitedMembers(partyId, actualUserId);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}/joined-members")
    @Authenticated
    public Response joinedMembers(@PathParam("id") @jakarta.validation.constraints.Positive Long partyId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return partyRepository.getJoinedMembers(partyId, actualUserId);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{id}/invitation-stats")
    @Authenticated
    public Response invitationStats(@PathParam("id") @jakarta.validation.constraints.Positive Long partyId) {
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
    public Response upload(@Valid FileUploadInput input,
                           @PathParam("partyId") @jakarta.validation.constraints.Positive long partyId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();

        if (actualUserId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(java.util.Map.of("error", "User ID required"))
                    .build();
        }
        return mediaRepository.upload(input, partyId, actualUserId);
    }

    @GET
    @Path("/{id}/can-edit")
    @Produces(MediaType.APPLICATION_JSON)
    @Authenticated
    public Response canEditParty(@PathParam("id") @jakarta.validation.constraints.Positive Long partyId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();

        if (actualUserId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "User ID required"))
                    .build();
        }

        Party party = partyRepository.getPartyByIdIfVisible(partyId, actualUserId);
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
    @Path("/{id}/media")
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response getPartyMedia(@PathParam("id") @jakarta.validation.constraints.Positive Long partyId) {
        Long callerId = currentUserResolver.currentUserIdIfAuthenticated().orElse(null);
        Party party = partyRepository.getPartyByIdIfVisible(partyId, callerId);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        if (!mediaRepository.hasGalleryAccess(party, callerId)) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("error", "Join the party to see the gallery"))
                    .build();
        }
        return Response.ok().entity(mediaRepository.getMediaByParty(partyId, callerId)).build();
    }
}
