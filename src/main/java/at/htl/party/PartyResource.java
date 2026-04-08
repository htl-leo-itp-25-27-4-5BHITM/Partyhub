package at.htl.party;

import at.htl.category.Category;
import at.htl.category.CategoryRepository;
import at.htl.location.Location;
import at.htl.location.LocationRepository;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.util.Map;

@Path("/api/party")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PartyResource {

    @Inject
    PartyRepository partyRepository;

    @Inject
    EntityManager entityManager;

    @Inject
    LocationRepository locationRepository;

    @Inject
    CategoryRepository categoryRepository;

    @Inject
    Logger logger;


    @PUT
    @Path("/{id}")
    @Transactional
    public Response updateParty(@PathParam("id") Long partyId,
                                @QueryParam("user") Long userId,
                                @HeaderParam("X-User-Id") Long headerUserId,
                                PartyUpdateDTO updateDTO) {

        // User ID aus Query oder Header
        Long actualUserId = userId != null ? userId : headerUserId;

        logger.infof("Update Party Request - PartyID: %d, UserID: %d", partyId, actualUserId);

        // 1. Validierung: User muss angegeben sein
        if (actualUserId == null) {
            logger.warn("Update failed: No user ID provided");
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "User ID ist erforderlich"))
                    .build();
        }

        // 2. Party aus Datenbank laden
        Party party = entityManager.find(Party.class, partyId);
        if (party == null) {
            logger.warnf("Update failed: Party %d not found", partyId);
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Party nicht gefunden"))
                    .build();
        }

        // 3. KRITISCH: Berechtigungsprüfung
        if (party.getHost_user() == null || !party.getHost_user().getId().equals(actualUserId)) {
            logger.warnf("Update failed: User %d is not the host of party %d", actualUserId, partyId);
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of(
                            "error", "Keine Berechtigung",
                            "message", "Nur der Veranstalter darf die Party bearbeiten"
                    ))
                    .build();
        }

        // 4. Validierung der Eingabedaten
        if (updateDTO.title == null || updateDTO.title.trim().isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Titel darf nicht leer sein"))
                    .build();
        }

        if (updateDTO.location_address == null || updateDTO.location_address.trim().isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Ort darf nicht leer sein"))
                    .build();
        }

        // 5. Party aktualisieren
        party.setTitle(updateDTO.title);
        party.setDescription(updateDTO.description);
        party.setTime_start(updateDTO.time_start);
        party.setTime_end(updateDTO.time_end);
        party.setMax_people(updateDTO.max_people);
        party.setMin_age(updateDTO.min_age);
        party.setMax_age(updateDTO.max_age);
        party.setWebsite(updateDTO.website);
        party.setFee(updateDTO.fee);

        // Location aktualisieren (wenn geändert)
        if (updateDTO.latitude != null && updateDTO.longitude != null) {
            Location location = party.getLocation();
            if (location == null) {
                location = new Location();
                location.setLatitude(updateDTO.latitude);
                location.setLongitude(updateDTO.longitude);
                entityManager.persist(location);
                party.setLocation(location);
            } else {
                location.setLatitude(updateDTO.latitude);
                location.setLongitude(updateDTO.longitude);
                entityManager.merge(location);
            }
        }

        // Category aktualisieren (wenn geändert)
        if (updateDTO.category_id != null) {
            Category category = entityManager.find(Category.class, updateDTO.category_id);
            if (category != null) {
                party.setCategory(category);
            }
        }

        entityManager.merge(party);

        logger.infof("✅ Party %d successfully updated by user %d", partyId, actualUserId);

        // 6. TODO: Push Notifications an Teilnehmer senden
        // sendUpdateNotificationsToAttendees(party, actualUserId);

        // 7. Response mit aktualisierter Party
        return Response.ok(party).build();
    }

    /**
     * NEU: Berechtigungsprüfung Endpoint
     * GET /api/party/{id}/can-edit?user={userId}
     *
     * Prüft, ob der User die Party bearbeiten darf
     */
    @GET
    @Path("/{id}/can-edit")
    public Response canEditParty(@PathParam("id") Long partyId,
                                 @QueryParam("user") Long userId,
                                 @HeaderParam("X-User-Id") Long headerUserId) {

        Long actualUserId = userId != null ? userId : headerUserId;

        if (actualUserId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "User ID erforderlich"))
                    .build();
        }

        Party party = entityManager.find(Party.class, partyId);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Party nicht gefunden"))
                    .build();
        }

        boolean canEdit = party.getHost_user() != null &&
                party.getHost_user().getId().equals(actualUserId);

        String role = canEdit ? "owner" : "attendee";

        return Response.ok(Map.of(
                "canEdit", canEdit,
                "role", role,
                "partyId", partyId,
                "userId", actualUserId
        )).build();
    }
}

// DTO für Party Update
class PartyUpdateDTO {
    public String title;
    public String description;
    public String location_address;
    public Double latitude;
    public Double longitude;
    public LocalDateTime time_start;
    public LocalDateTime time_end;
    public Integer max_people;
    public Integer min_age;
    public Integer max_age;
    public String website;
    public Double fee;
    public Long category_id;
}