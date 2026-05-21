package at.htl.notification;

import java.util.List;

import at.htl.auth.CurrentUserResolver;
import io.quarkus.security.Authenticated;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
@Path("/api/notifications")
public class NotificationResource {
    @Inject
    NotificationRepository notificationRepository;
    @Inject
    CurrentUserResolver currentUserResolver;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("")
    @Transactional
    @Authenticated
    public Response getNotifications() {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        List<NotificationDto> notifications = notificationRepository.getNotificationsByUser(actualUserId)
                .stream()
                .map(NotificationDto::from)
                .toList();
        return Response.ok().entity(notifications).build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/unread")
    @Transactional
    @Authenticated
    public Response getUnreadNotifications() {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        List<NotificationDto> notifications = notificationRepository.getUnreadNotifications(actualUserId)
                .stream()
                .map(NotificationDto::from)
                .toList();
        return Response.ok().entity(notifications).build();
    }

    @POST
    @Path("/{id}/read")
    @Transactional
    @Authenticated
    public Response markAsRead(
            @PathParam("id") Long notificationId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return notificationRepository.markAsRead(notificationId, actualUserId);
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @Authenticated
    public Response deleteNotification(
            @PathParam("id") Long notificationId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return notificationRepository.deleteNotification(notificationId, actualUserId);
    }
}
