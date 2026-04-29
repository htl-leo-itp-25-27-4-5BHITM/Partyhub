package at.htl.notification;

import java.time.LocalDateTime;

public record NotificationDto(
        Long id,
        Long recipient_id,
        Long sender_id,
        Long party_id,
        String status,
        LocalDateTime created_at,
        String message
) {
    public static NotificationDto from(Notification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getRecipient() != null ? notification.getRecipient().getId() : null,
                notification.getSender() != null ? notification.getSender().getId() : null,
                notification.getParty() != null ? notification.getParty().getId() : null,
                notification.getStatus(),
                notification.getCreated_at(),
                notification.getMessage()
        );
    }
}
