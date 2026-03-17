package at.htl.user_location;

import at.htl.user.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@ApplicationScoped
@Path("/api/userLocation")
public class UserLocationResource {
    @Inject
    UserLocationRepository userlocRep;

    @Inject
    EntityManager em;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<UserLocation> getAllLocations() {
        return userlocRep.getAllLocations();
    }

    @POST
    @Transactional
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateLocation(UserLocationUpdateDto dto) {
        User user = em.find(User.class, dto.userId());
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"User not found\"}")
                    .build();
        }

        UserLocation existingLocation = userlocRep.findByUserId(dto.userId());

        if (existingLocation != null) {
            existingLocation.setLatitude(dto.latitude());
            existingLocation.setLongitude(dto.longitude());
            userlocRep.saveOrUpdate(existingLocation);
            return Response.ok(existingLocation).build();
        } else {
            UserLocation newLocation = new UserLocation();
            newLocation.setUser(user);
            newLocation.setLatitude(dto.latitude());
            newLocation.setLongitude(dto.longitude());
            userlocRep.saveOrUpdate(newLocation);
            return Response.ok(newLocation).build();
        }
    }

    @GET
    @Path("/party/{partyId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getLocationsByParty(@PathParam("partyId") Long partyId) {
        List<UserLocation> locations = userlocRep.getLocationsByPartyId(partyId);
        return Response.ok(locations).build();
    }

    @GET
    @Path("/user/{userId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getUserLocation(@PathParam("userId") Long userId) {
        UserLocation location = userlocRep.findByUserId(userId);
        if (location == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Location not found\"}")
                    .build();
        }
        return Response.ok(location).build();
    }
}