package at.htl.notificationsettings;

/**
 * Complete notification-settings state. On updates a missing (null) field keeps its stored value,
 * so older clients that do not know the newer switches cannot turn them off by accident.
 */
public record NotificationSettingsDto(
    Boolean allEnabled,
    Boolean emailEnabled,
    Boolean pushEnabled,
    Boolean smsEnabled,
    Boolean inAppEnabled,
    Boolean partyInvites,
    Boolean invitationResponses,
    Boolean partyUpdates,
    Boolean partyCancellations,
    Boolean followEvents,
    Boolean unfollows
) {
    public static NotificationSettingsDto from(UserNotificationSettings settings) {
        return new NotificationSettingsDto(
            settings.isAllEnabled(),
            settings.isEmailEnabled(),
            settings.isPushEnabled(),
            settings.isSmsEnabled(),
            settings.isInAppEnabled(),
            settings.isPartyInvites(),
            settings.isInvitationResponses(),
            settings.isPartyUpdates(),
            settings.isPartyCancellations(),
            settings.isFollowEvents(),
            settings.isUnfollows()
        );
    }

    void applyTo(UserNotificationSettings settings) {
        if (allEnabled != null) settings.setAllEnabled(allEnabled);
        if (emailEnabled != null) settings.setEmailEnabled(emailEnabled);
        if (pushEnabled != null) settings.setPushEnabled(pushEnabled);
        if (smsEnabled != null) settings.setSmsEnabled(smsEnabled);
        if (inAppEnabled != null) settings.setInAppEnabled(inAppEnabled);
        if (partyInvites != null) settings.setPartyInvites(partyInvites);
        if (invitationResponses != null) settings.setInvitationResponses(invitationResponses);
        if (partyUpdates != null) settings.setPartyUpdates(partyUpdates);
        if (partyCancellations != null) settings.setPartyCancellations(partyCancellations);
        if (followEvents != null) settings.setFollowEvents(followEvents);
        if (unfollows != null) settings.setUnfollows(unfollows);
    }
}
