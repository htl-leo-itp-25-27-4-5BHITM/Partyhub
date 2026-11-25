package at.htl.notificationsettings;

public record NotificationSettingsDto(
    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictBooleanDeserializer.class) boolean emailEnabled,
    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictBooleanDeserializer.class) boolean pushEnabled,
    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictBooleanDeserializer.class) boolean smsEnabled,
    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictBooleanDeserializer.class) boolean inAppEnabled,
    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictBooleanDeserializer.class) boolean partyInvites,
    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictBooleanDeserializer.class) boolean partyUpdates,
    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using=at.htl.validation.StrictBooleanDeserializer.class) boolean followEvents
) {
    public static NotificationSettingsDto from(UserNotificationSettings settings) {
        return new NotificationSettingsDto(
            settings.isEmailEnabled(),
            settings.isPushEnabled(),
            settings.isSmsEnabled(),
            settings.isInAppEnabled(),
            settings.isPartyInvites(),
            settings.isPartyUpdates(),
            settings.isFollowEvents()
        );
    }
}
