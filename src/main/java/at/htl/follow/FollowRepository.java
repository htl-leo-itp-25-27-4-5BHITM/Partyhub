package at.htl.follow;

import at.htl.notificationsettings.NotificationCategory;

import java.time.LocalDateTime;
import java.util.List;

import at.htl.history.FollowEventType;
import at.htl.live.UserChanged;
import jakarta.enterprise.event.Event;
import at.htl.history.HistoryRecorder;
import at.htl.notification.Notification;
import at.htl.notification.NotificationRepository;
import at.htl.user.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class FollowRepository {

    @Inject
    EntityManager entityManager;

    @Inject
    NotificationRepository notificationRepository;

    @Inject
    HistoryRecorder historyRecorder;

    /** Tells both users' open pages (after commit) that a follow changed. */
    @Inject
    Event<UserChanged> userChanged;

    private void followsChanged(long followerId, long followedId) {
        userChanged.fire(new UserChanged(followerId, UserChanged.FOLLOWS));
        userChanged.fire(new UserChanged(followedId, UserChanged.FOLLOWS));
    }

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

    /** A pending incoming follow request with the time it was sent (null for old requests). */
    public record PendingRequest(User requester, LocalDateTime requestedAt) {
    }

    public List<PendingRequest> getPendingFollowerRequestsWithTime(long userId) {
        return entityManager.createQuery(
                        "SELECT u, f.requestedAt FROM User u JOIN Follow f ON u.id = f.user1_id " +
                                "WHERE f.user2_id = :userId AND f.status.status_id = 1",
                        Object[].class)
                .setParameter("userId", userId)
                .getResultList().stream()
                .map(row -> new PendingRequest((User) row[0], (LocalDateTime) row[1]))
                .toList();
    }

    public List<User> getPendingFollowerRequests(long userId) {
        return entityManager.createQuery(
                "SELECT u FROM User u JOIN Follow f ON u.id = f.user1_id " +
                        "WHERE f.user2_id = :userId AND f.status.status_id = 1", User.class)
                .setParameter("userId", userId)
                .getResultList();
    }

    /** "following" (accepted), "pending" (request sent) or "none" for the follow from user1 to user2. */
    public String followStatus(long user1Id, long user2Id) {
        return entityManager.createQuery(
                        "SELECT f.status.status_id FROM Follow f WHERE f.user1_id = :user1Id AND f.user2_id = :user2Id",
                        Long.class)
                .setParameter("user1Id", user1Id)
                .setParameter("user2Id", user2Id)
                .getResultStream()
                .findFirst()
                .map(status -> status == 2L ? "following" : status == 1L ? "pending" : "none")
                .orElse("none");
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
    @Inject
    at.htl.block.BlockRepository blockRepository;

    /**
     * user1 follows user2: accepted at once for a public account, a pending request for a
     * private one. Self-follows and follows across a block are rejected.
     */
    @Transactional
    public Response createFollowRequest(long user1Id, long user2Id) {
        if (user1Id == user2Id) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"message\": \"You cannot follow yourself\"}")
                    .build();
        }
        User target = entityManager.find(User.class, user2Id);
        if (target == null || blockRepository.isBlockedEitherWay(user1Id, user2Id)) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"message\": \"User not found\"}")
                    .build();
        }
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
        follow.setRequestedAt(LocalDateTime.now());

        if (!target.isPrivateAccount()) {
            follow.setStatus(entityManager.find(FollowStatus.class, 2L));
            entityManager.persist(follow);
            historyRecorder.recordFollow(user1Id, user2Id, FollowEventType.FOLLOWED);
            followsChanged(user1Id, user2Id);
            User follower = entityManager.find(User.class, user1Id);
            notificationRepository.createNotification(
                    new Notification(target, follower, null, displayName(follower) + " follows you now."),
                    NotificationCategory.FOLLOW_EVENTS);
            return Response.status(Response.Status.CREATED)
                    .entity("{\"message\": \"Following\", \"status\": \"following\"}").build();
        }

        // The new request shows up in the target's notifications.
        userChanged.fire(new UserChanged(user2Id, UserChanged.NOTIFICATIONS));
        follow.setStatus(entityManager.find(FollowStatus.class, 1L));
        entityManager.persist(follow);
        return Response.status(Response.Status.CREATED)
                .entity("{\"message\": \"Follow request sent\", \"status\": \"pending\"}").build();
    }

    /** Accepts every pending request to {@code userId}, e.g. when the account becomes public. */
    @Transactional(Transactional.TxType.MANDATORY)
    public int acceptAllPendingRequests(long userId) {
        List<Long> requesterIds = entityManager.createQuery(
                        "SELECT f.user1_id FROM Follow f WHERE f.user2_id = :userId AND f.status.status_id = 1", Long.class)
                .setParameter("userId", userId)
                .getResultList();
        for (Long requesterId : requesterIds) {
            acceptFollowRequest(requesterId, userId);
        }
        return requesterIds.size();
    }

    /**
     * Removes every follow and request between two users without notifying anyone (blocking).
     * Ended accepted follows are recorded as history like an unfollow.
     */
    @Transactional(Transactional.TxType.MANDATORY)
    public void removeAllBetween(long a, long b) {
        List<Follow> follows = entityManager.createQuery(
                        "SELECT f FROM Follow f WHERE (f.user1_id = :a AND f.user2_id = :b) OR (f.user1_id = :b AND f.user2_id = :a)",
                        Follow.class)
                .setParameter("a", a)
                .setParameter("b", b)
                .getResultList();
        for (Follow follow : follows) {
            boolean wasAccepted = follow.getStatus() != null && Long.valueOf(2L).equals(follow.getStatus().getStatus_id());
            entityManager.remove(follow);
            if (wasAccepted) {
                historyRecorder.recordFollow(follow.getUser1_id(), follow.getUser2_id(), FollowEventType.UNFOLLOWED);
            }
        }
        if (!follows.isEmpty()) {
            followsChanged(a, b);
        }
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
        historyRecorder.recordFollow(user1Id, user2Id, FollowEventType.FOLLOWED);
        followsChanged(user1Id, user2Id);
        notifyFollowAccepted(user1Id, user2Id);

        return Response.ok().entity("{\"message\": \"Follow request accepted\"}").build();
    }

private void notifyFollowAccepted(long followerId, long acceptedById) {
    User follower = entityManager.find(User.class, followerId);
    User acceptedBy = entityManager.find(User.class, acceptedById);

    if (follower == null || acceptedBy == null) {
        return;
    }

    String acceptedMessage = displayName(acceptedBy) + " accepted your follow request.";
    String followsNowMessage = displayName(follower) + " follows you now.";
    notificationRepository.createNotification(new Notification(follower, acceptedBy, null, acceptedMessage),
            NotificationCategory.FOLLOW_EVENTS);
    notificationRepository.createNotification(new Notification(acceptedBy, follower, null, followsNowMessage),
            NotificationCategory.FOLLOW_EVENTS);
}

private String displayName(User user) {
    if (user == null) {
        return "Someone";
    }
    if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
        return user.getDisplayName();
    }
    if (user.getUsername() != null && !user.getUsername().isBlank()) {
        return user.getUsername();
    }
    if (user.getDistinctName() != null && !user.getDistinctName().isBlank()) {
        return user.getDistinctName();
    }
    return "Someone";
}

@Transactional
public Response removeFollow(long user1Id, long user2Id) {
    return removeFollow(user1Id, user2Id, false);
}

/**
 * Removes the follow or request from user1 to user2. {@code byFollower} marks that user1 ended
 * their own accepted follow, which tells user2 with an unfollow notification.
 */
@Transactional
public Response removeFollow(long user1Id, long user2Id, boolean byFollower) {
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

    boolean wasAccepted = follow.getStatus() != null
            && Long.valueOf(2L).equals(follow.getStatus().getStatus_id());
    entityManager.remove(follow);
    if (wasAccepted) {
        historyRecorder.recordFollow(user1Id, user2Id, FollowEventType.UNFOLLOWED);
        if (byFollower) {
            User follower = entityManager.find(User.class, user1Id);
            User followed = entityManager.find(User.class, user2Id);
            if (follower != null && followed != null) {
                notificationRepository.createNotification(
                        new Notification(followed, follower, null, displayName(follower) + " unfollowed you."),
                        NotificationCategory.UNFOLLOWS);
            }
        }
    }
    followsChanged(user1Id, user2Id);
    // A withdrawn or declined request disappears from the target's notifications.
    userChanged.fire(new UserChanged(user2Id, UserChanged.NOTIFICATIONS));
    return Response.noContent().build();
}
}
