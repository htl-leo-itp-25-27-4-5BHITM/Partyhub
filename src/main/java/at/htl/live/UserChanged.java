package at.htl.live;

/**
 * CDI event fired inside a write transaction when something a user sees has changed; observers only
 * see it after commit. {@code kind} tells the client what to reload:
 * {@link #NOTIFICATIONS} (notifications, invitations, follow requests),
 * {@link #FOLLOWS} (followers / following, follow history) or {@link #ATTENDANCE} (guests of the user's parties).
 */
public record UserChanged(Long userId, String kind) {
    public static final String NOTIFICATIONS = "notifications";
    public static final String FOLLOWS = "follows";
    public static final String ATTENDANCE = "attendance";
}
