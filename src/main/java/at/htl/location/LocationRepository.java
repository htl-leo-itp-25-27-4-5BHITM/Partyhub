package at.htl.location;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.core.Response;

import java.util.List;

@ApplicationScoped
public class LocationRepository {
    @Inject
    EntityManager entityManager;

    public List<Location> getLocation() {
        return entityManager.createQuery("SELECT l FROM Location l", Location.class).getResultList();
    }

    public Response addLocation(Location location){
        entityManager.persist(location);
        return Response.ok().build();
    }

    public Location findByLatitudeAndLongitude(double latitude, double longitude){
        Location result;
        try {
            result = entityManager.createQuery("SELECT l from Location l where latitude=:latitude and longitude=:longitude", Location.class).setParameter("latitude", latitude).setParameter("longitude", longitude).getSingleResult();
        }catch (Exception e){
            result = null;
        }
        return result;
    }

}
