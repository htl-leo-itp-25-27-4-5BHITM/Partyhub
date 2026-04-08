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

    public List<Notification> getNotificationsByUser(Long userId) {
        if (userId == null) {
            return List.of();
        }
        return entityManager.createQuery(
                "SELECT n FROM Notification n WHERE n.recipient.id = :userId ORDER BY n.created_at DESC",
                Notification.class)
                .setParameter("userId", userId)
                .getResultList();
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        if (userId == null) {
            return List.of();
        }
        return entityManager.createQuery(
                "SELECT n FROM Notification n WHERE n.recipient.id = :userId AND n.status = 'UNREAD' ORDER BY n.created_at DESC",
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

        entityManager.remove(notification);
        return Response.noContent().build();
    }

    public void createNotification(Notification notification) {
        entityManager.persist(notification);
    }
}
