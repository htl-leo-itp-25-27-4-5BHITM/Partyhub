package at.htl.repository;

import at.htl.model.Follow;
import at.htl.model.FollowStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class FollowRepository {

    @Inject
    EntityManager entityManager;

    public long getFollowerCount(Long userId) {
        return entityManager.createQuery(
                "SELECT COUNT(f) FROM Follow f WHERE f.user2_id = :userId AND f.status.name = 'accepted'",
                Long.class)
                .setParameter("userId", userId)
                .getSingleResult();
    }

    public long getFollowingCount(Long userId) {
        return entityManager.createQuery(
                "SELECT COUNT(f) FROM Follow f WHERE f.user1_id = :userId AND f.status.name = 'accepted'",
                Long.class)
                .setParameter("userId", userId)
                .getSingleResult();
    }
}