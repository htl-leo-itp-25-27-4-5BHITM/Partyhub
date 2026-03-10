package at.htl.user_location;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@ApplicationScoped
@Path("/user-location")
public class UserLocationResource {
    @Inject
    UserLocationRepository userlocRep;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<UserLocation> getAllLocations(){
        return userlocRep.getAllLocations();
    }

}