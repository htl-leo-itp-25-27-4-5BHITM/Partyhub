package at.htl.notification;

import java.util.List;

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

    public List<Notification> getNotificationsByUser(Long userId) {
        if (userId == null) {
            return List.of();
        }
        return entityManager.createQuery(
                "SELECT n FROM Notification n " +
                        "LEFT JOIN FETCH n.recipient " +
                        "LEFT JOIN FETCH n.sender " +
                        "LEFT JOIN FETCH n.party " +
                        "WHERE n.recipient.id = :userId ORDER BY n.created_at DESC",
                Notification.class)
                .setParameter("userId", userId)
                .getResultList();
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
