package at.htl.notification;

import java.util.List;

import at.htl.notificationsettings.UserNotificationSettings;
import at.htl.notificationsettings.UserNotificationSettingsRepository;
import jakarta.enterprise.context.ApplicationScoped;
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

        return query.getResultList();
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

        if (isProtectedNotification(notification)) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity("{\"error\": \"This notification cannot be deleted\"}")
                    .build();
        }

        entityManager.remove(notification);
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

        return entityManager.createQuery(
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
    }

    public boolean isProtectedNotification(Notification notification) {
        if (notification == null || notification.getMessage() == null) {
            return false;
        }

        String message = notification.getMessage().toLowerCase();
        return message.contains("accepted your follow request") ||
                message.contains("just followed you") ||
                message.contains("follows you now");
    }
}
