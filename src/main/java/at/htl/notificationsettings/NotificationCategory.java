package at.htl.notificationsettings;

/** What a notification is about; each category has its own switch in the notification settings. */
public enum NotificationCategory {
    /** Invitations and their withdrawal. */
    PARTY_INVITES,
    /** Accepts, declines, joins, leaves and bring-along pledges reported to the host. */
    INVITATION_RESPONSES,
    /** Party changes and the weekly digest. */
    PARTY_UPDATES,
    PARTY_CANCELLATIONS,
    /** Follow requests, accepted requests and new followers. */
    FOLLOW_EVENTS,
    UNFOLLOWS
}
