package at.htl.user_location;

import at.htl.user.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.util.List;

@ApplicationScoped
public class UserLocationRepository {
    @Inject
    EntityManager em;

    public List<UserLocation> getAllLocations() {
        return em.createQuery("SELECT ul FROM UserLocation ul", UserLocation.class)
                .getResultList();
    }

    public UserLocation findByUserId(Long userId) {
        return em.createQuery("SELECT ul FROM UserLocation ul WHERE ul.user.id = :userId", UserLocation.class)
                .setParameter("userId", userId)
                .getResultStream()
                .findFirst()
                .orElse(null);
    }

    public void saveOrUpdate(UserLocation location) {
        if (location.getId() == null) {
            em.persist(location);
        } else {
            em.merge(location);
        }
    }

    public List<UserLocation> getLocationsByPartyId(Long partyId) {
        return em.createQuery(
                "SELECT ul FROM UserLocation ul WHERE ul.user.id IN " +
                "(SELECT u.id FROM Party p JOIN p.users u WHERE p.id = :partyId)",
                UserLocation.class)
                .setParameter("partyId", partyId)
                .getResultList();
    }
}
