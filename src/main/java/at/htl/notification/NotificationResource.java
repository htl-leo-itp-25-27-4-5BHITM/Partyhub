package at.htl.notification;

import java.util.List;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
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

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("")
    @Transactional
    public Response getNotifications(
            @QueryParam("user") Long userId,
            @HeaderParam("X-User-Id") Long headerUserId) {
        Long actualUserId = userId != null ? userId : headerUserId;
        List<Notification> notifications = notificationRepository.getNotificationsByUser(actualUserId);
        return Response.ok().entity(notifications).build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/unread")
    @Transactional
    public Response getUnreadNotifications(
            @QueryParam("user") Long userId,
            @HeaderParam("X-User-Id") Long headerUserId) {
        Long actualUserId = userId != null ? userId : headerUserId;
        List<Notification> notifications = notificationRepository.getUnreadNotifications(actualUserId);
        return Response.ok().entity(notifications).build();
    }

    @POST
    @Path("/{id}/read")
    @Transactional
    public Response markAsRead(
            @PathParam("id") Long notificationId,
            @QueryParam("user") Long userId,
            @HeaderParam("X-User-Id") Long headerUserId) {
        Long actualUserId = userId != null ? userId : headerUserId;
        return notificationRepository.markAsRead(notificationId, actualUserId);
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response deleteNotification(
            @PathParam("id") Long notificationId,
            @QueryParam("user") Long userId,
            @HeaderParam("X-User-Id") Long headerUserId) {
        Long actualUserId = userId != null ? userId : headerUserId;
        return notificationRepository.deleteNotification(notificationId, actualUserId);
    }
}
