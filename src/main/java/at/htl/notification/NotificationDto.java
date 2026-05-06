package at.htl.notification;

import jakarta.validation.constraints.NotNull;
import at.htl.validation.SafeText;
import java.time.LocalDateTime;

public record NotificationDto(
        @NotNull(message = "User ID is required")
        @SafeText
        Long userId,

        @NotNull(message = "Message is required")
        @SafeText
        String message,

        @NotNull(message = "Status is required")
        @SafeText
        String status,

        LocalDateTime createdAt
) {
    public static NotificationDto from(Notification notification) {
        return new NotificationDto(
            notification.getRecipient().getId(),
            notification.getMessage(),
            notification.getStatus(),
            notification.getCreated_at()
        );
    }
}
