package at.htl.notification;

import java.util.List;

import at.htl.notificationsettings.UserNotificationSettings;
import at.htl.notificationsettings.UserNotificationSettingsRepository;
import at.htl.live.UserChanged;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
@Transactional
public class NotificationRepository {

    @Inject
    EntityManager entityManager;

    @Inject
    OutOfAppNotificationService outOfAppNotificationService;

    @Inject
    UserNotificationSettingsRepository userNotificationSettingsRepository;

    /** Tells the recipient's open pages (after commit) that their notifications changed. */
    @Inject
    Event<UserChanged> userChanged;

    private void notificationsChanged(Long userId) {
        if (userId != null) {
            userChanged.fire(new UserChanged(userId, UserChanged.NOTIFICATIONS));
        }
    }

    public List<Notification> getNotificationsByUser(Long userId) {
        return getNotificationsByUser(userId, null, null, null);
    }

    public List<Notification> getNotificationsByUser(Long userId, Long partyId, String type, String search) {
        if (userId == null) {
            return List.of();
        }

        StringBuilder jpql = new StringBuilder(
                "SELECT n FROM Notification n " +
                "LEFT JOIN FETCH n.recipient " +
                "LEFT JOIN FETCH n.sender " +
                "LEFT JOIN FETCH n.party " +
                "WHERE n.recipient.id = :userId");

        if (partyId != null) {
            jpql.append(" AND n.party.id = :partyId");
        }

        if (type != null && !type.isBlank()) {
            String upperType = type.toUpperCase();
            switch (upperType) {
                case "INVITATION" -> jpql.append(" AND LOWER(n.message) LIKE '%invited you to the party%'");
                case "UPDATE" -> jpql.append(" AND LOWER(n.message) LIKE '%was updated%'");
                case "CANCELLATION" -> jpql.append(" AND (LOWER(n.message) LIKE '%was canceled%' OR LOWER(n.message) LIKE '%was cancelled%')");
                case "FOLLOW" -> jpql.append(" AND (LOWER(n.message) LIKE '%accepted your follow request%' OR LOWER(n.message) LIKE '%just followed you%' OR LOWER(n.message) LIKE '%follows you now%')");
            }
        }

        if (search != null && !search.isBlank()) {
            jpql.append(" AND LOWER(n.message) LIKE :search");
        }

        jpql.append(" ORDER BY n.created_at DESC");

        var query = entityManager.createQuery(jpql.toString(), Notification.class)
                .setParameter("userId", userId);

        if (partyId != null) {
            query.setParameter("partyId", partyId);
        }

        if (search != null && !search.isBlank()) {
            query.setParameter("search", "%" + search.toLowerCase() + "%");
        }

        return query.setMaxResults(100).getResultList();
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        if (userId == null) {
            return List.of();
        }
        return entityManager.createQuery(
                "SELECT n FROM Notification n " +
                        "LEFT JOIN FETCH n.recipient " +
                        "LEFT JOIN FETCH n.sender " +
                        "LEFT JOIN FETCH n.party " +
                        "WHERE n.recipient.id = :userId AND n.status = 'UNREAD' ORDER BY n.created_at DESC",
                Notification.class)
                .setParameter("userId", userId)
                .getResultList();
    }

    public long countUnreadNotifications(Long userId) {
        if (userId == null) {
            return 0;
        }
        return entityManager.createQuery(
                "SELECT COUNT(n) FROM Notification n " +
                        "WHERE n.recipient.id = :userId AND n.status = 'UNREAD'",
                Long.class)
                .setParameter("userId", userId)
                .getSingleResult();
    }

    public int markAllAsRead(Long userId) {
        if (userId == null) {
            return 0;
        }
        int updated = entityManager.createQuery(
                "UPDATE Notification n SET n.status = 'READ' " +
                        "WHERE n.recipient.id = :userId AND n.status = 'UNREAD'")
                .setParameter("userId", userId)
                .executeUpdate();
        if (updated > 0) {
            notificationsChanged(userId);
        }
        return updated;
    }

    public Response markAsRead(Long notificationId, Long userId) {
        if (notificationId == null || userId == null) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

        Notification notification = entityManager.find(Notification.class, notificationId);
        if (notification == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        if (!notification.getRecipient().getId().equals(userId)) {
            return Response.status(Response.Status.FORBIDDEN).build();
        }

        notification.setStatus("READ");
        entityManager.merge(notification);
        notificationsChanged(userId);
        return Response.ok().build();
    }

    public Response deleteNotification(Long notificationId, Long userId) {
        if (notificationId == null || userId == null) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

        Notification notification = entityManager.find(Notification.class, notificationId);
        if (notification == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        if (!notification.getRecipient().getId().equals(userId)) {
            return Response.status(Response.Status.FORBIDDEN).build();
        }

        entityManager.remove(notification);
        notificationsChanged(userId);
        return Response.noContent().build();
    }

    public void createNotification(Notification notification) {
        if (notification != null && notification.getRecipient() != null
                && notification.getRecipient().getId() != null) {
            UserNotificationSettings settings = userNotificationSettingsRepository
                    .findByUserId(notification.getRecipient().getId()).orElse(null);
            if (settings != null && !settings.isInAppEnabled()) {
                return;
            }
        }
        entityManager.persist(notification);
        outOfAppNotificationService.sendNotification(notification);
        if (notification != null && notification.getRecipient() != null) {
            notificationsChanged(notification.getRecipient().getId());
        }
    }

    public int deleteByPartyId(Long partyId) {
        if (partyId == null) {
            return 0;
        }

        return entityManager.createQuery(
                        "DELETE FROM Notification n WHERE n.party.id = :partyId")
                .setParameter("partyId", partyId)
                .executeUpdate();
    }

    public int deleteInvitationNotifications(Long partyId, Long senderId, Long recipientId) {
        if (partyId == null || senderId == null || recipientId == null) {
            return 0;
        }

        int deleted = entityManager.createQuery(
                        "DELETE FROM Notification n " +
                                "WHERE n.party.id = :partyId " +
                                "AND n.sender.id = :senderId " +
                                "AND n.recipient.id = :recipientId " +
                                "AND (LOWER(n.message) LIKE :englishInvite " +
                                "OR LOWER(n.message) LIKE :legacyInvite)")
                .setParameter("partyId", partyId)
                .setParameter("senderId", senderId)
                .setParameter("recipientId", recipientId)
                .setParameter("englishInvite", "%invited you to the party%")
                .setParameter("legacyInvite", "%eingeladen%")
                .executeUpdate();
        if (deleted > 0) {
            notificationsChanged(recipientId);
        }
        return deleted;
    }

}
