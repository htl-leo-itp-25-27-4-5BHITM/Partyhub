package at.htl.follow;

import at.htl.user.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.List;

@ApplicationScoped
public class FollowRepository {

    @Inject
    EntityManager entityManager;

    @Inject
    Logger logger;

    public long getFollowerCount(long userId) {
        return entityManager.createQuery(
                "SELECT COUNT(f) FROM Follow f WHERE f.user2_id = :userId AND f.status.status_id = 2",
                Long.class)
                .setParameter("userId", userId)
                .getSingleResult();
    }
    public long getFollowingCount(long userId) {
        return entityManager.createQuery(
                "SELECT COUNT(f) FROM Follow f WHERE f.user1_id = :userId AND f.status.status_id = 2",
                Long.class)
                .setParameter("userId", userId)
                .getSingleResult();
    }

    public List<User> getFollowers(long userId) {
        return entityManager.createQuery(
                "SELECT u FROM User u JOIN Follow f ON u.id = f.user1_id " +
                "WHERE f.user2_id = :userId AND f.status.status_id = 2",
                User.class)
                .setParameter("userId", userId)
                .getResultList();
    }

    public List<User> getFollowing(long userId) {
        return entityManager.createQuery(
                "SELECT u FROM User u JOIN Follow f ON u.id = f.user2_id " +
                "WHERE f.user1_id = :userId AND f.status.status_id = 2",
                User.class)
                .setParameter("userId", userId)
                .getResultList();
    }

    public List<User> getPendingFollowerRequests(long userId) {
        return entityManager.createQuery(
                "SELECT u FROM User u JOIN Follow f ON u.id = f.user1_id " +
                "WHERE f.user2_id = :userId AND f.status.status_id = 1",
                User.class)
                .setParameter("userId", userId)
                .getResultList();
    }
    public boolean isFollowing(long user1Id, long user2Id) {
        List<Follow> follows = entityManager.createQuery(
                "SELECT f FROM Follow f WHERE f.user1_id = :user1Id AND f.user2_id = :user2Id AND f.status.status_id = 2",
                Follow.class)
                .setParameter("user1Id", user1Id)
                .setParameter("user2Id", user2Id)
                .getResultList();
        return !follows.isEmpty();
    }
    @Transactional
    public Response createFollowRequest(long user1Id, long user2Id) {
        if (isFollowing(user1Id, user2Id)) {
            return Response.status(Response.Status.CONFLICT)
                    .entity("{\"message\": \"Already following this user\"}")
                    .build();
        }

        List<Follow> existing = entityManager.createQuery(
                "SELECT f FROM Follow f WHERE f.user1_id = :user1Id AND f.user2_id = :user2Id",
                Follow.class)
                .setParameter("user1Id", user1Id)
                .setParameter("user2Id", user2Id)
                .getResultList();

        if (!existing.isEmpty()) {
            return Response.status(Response.Status.CONFLICT)
                    .entity("{\"message\": \"Follow request already exists\"}")
                    .build();
        }

        Follow follow = new Follow();
        follow.setUser1_id(user1Id);
        follow.setUser2_id(user2Id);

        FollowStatus pendingStatus = entityManager.find(FollowStatus.class, 1L);
        follow.setStatus(pendingStatus);

        entityManager.persist(follow);
        return Response.ok().entity("{\"message\": \"Follow request sent\"}").build();
    }
    @Transactional
    public Response acceptFollowRequest(long user1Id, long user2Id) {
        Follow follow = entityManager.createQuery(
                "SELECT f FROM Follow f WHERE f.user1_id = :user1Id AND f.user2_id = :user2Id AND f.status.status_id = 1",
                Follow.class)
                .setParameter("user1Id", user1Id)
                .setParameter("user2Id", user2Id)
                .getResultStream()
                .findFirst()
                .orElse(null);

        if (follow == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"message\": \"No pending follow request found\"}")
                    .build();
        }

        FollowStatus acceptedStatus = entityManager.find(FollowStatus.class, 2L);
        follow.setStatus(acceptedStatus);
        entityManager.merge(follow);

        return Response.ok().entity("{\"message\": \"Follow request accepted\"}").build();
    }
    @Transactional
    public Response removeFollow(long user1Id, long user2Id) {
        Follow follow = entityManager.createQuery(
                "SELECT f FROM Follow f WHERE f.user1_id = :user1Id AND f.user2_id = :user2Id",
                Follow.class)
                .setParameter("user1Id", user1Id)
                .setParameter("user2Id", user2Id)
                .getResultStream()
                .findFirst()
                .orElse(null);

        if (follow == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"message\": \"No follow relationship found\"}")
                    .build();
        }

        entityManager.remove(follow);
        return Response.ok().entity("{\"message\": \"Follow removed\"}").build();
    }
}