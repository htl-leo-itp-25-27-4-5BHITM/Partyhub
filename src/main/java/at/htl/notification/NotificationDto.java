package at.htl.notification;

import java.time.LocalDateTime;

public record NotificationDto(
        Long id,

        Long userId,

        Long recipientId,

        Long senderId,

        Long partyId,

        String partyTitle,

        String message,

        String status,

        LocalDateTime createdAt
) {
    public static NotificationDto from(Notification notification) {
        Long recipientId = notification.getRecipient() != null
                ? notification.getRecipient().getId()
                : null;
        Long senderId = notification.getSender() != null
                ? notification.getSender().getId()
                : null;
        Long partyId = notification.getParty() != null
                ? notification.getParty().getId()
                : null;
        String partyTitle = notification.getParty() != null
                ? notification.getParty().getTitle()
                : null;

        return new NotificationDto(
            notification.getId(),
            recipientId,
            recipientId,
            senderId,
            partyId,
            partyTitle,
            notification.getMessage(),
            notification.getStatus(),
            notification.getCreated_at()
        );
    }
}
