package at.htl.user_location;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.util.List;

public class UserLocationRepository {
    @Inject
    EntityManager em;
    public List<UserLocation> getAllLocations() {
        return em.createQuery("SELECT ul FROM UserLocation ul", UserLocation.class)
                .getResultList();
    }
}
