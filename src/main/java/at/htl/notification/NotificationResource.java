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
    public Response getNotifications(
            @QueryParam("partyId") Long partyId,
            @QueryParam("type") @jakarta.validation.constraints.Size(max=50) String type,
            @QueryParam("search") @jakarta.validation.constraints.Size(max=200) String search) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        List<NotificationDto> notifications = notificationRepository
                .getNotificationsByUser(actualUserId, partyId, type, search)
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

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/unread/count")
    @Transactional
    @Authenticated
    public Response getUnreadCount() {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        long count = notificationRepository.countUnreadNotifications(actualUserId);
        return Response.ok(java.util.Map.of("count", count)).build();
    }

    @POST
    @Path("/read-all")
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Authenticated
    public Response markAllAsRead() {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        int updated = notificationRepository.markAllAsRead(actualUserId);
        return Response.ok(java.util.Map.of("updated", updated)).build();
    }

    @POST
    @Path("/{id}/read")
    @Transactional
    @Authenticated
    public Response markAsRead(
            @PathParam("id") @jakarta.validation.constraints.Positive Long notificationId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return notificationRepository.markAsRead(notificationId, actualUserId);
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @Authenticated
    public Response deleteNotification(
            @PathParam("id") @jakarta.validation.constraints.Positive Long notificationId) {
        Long actualUserId = currentUserResolver.requireCurrentUserId();
        return notificationRepository.deleteNotification(notificationId, actualUserId);
    }
}
