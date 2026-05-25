package at.htl.notificationsettings;

public record NotificationSettingsDto(
    boolean emailEnabled,
    boolean pushEnabled,
    boolean smsEnabled,
    boolean inAppEnabled,
    boolean partyInvites,
    boolean partyUpdates,
    boolean followEvents
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
