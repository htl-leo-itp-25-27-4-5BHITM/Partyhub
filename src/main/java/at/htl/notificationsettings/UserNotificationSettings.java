package at.htl.notificationsettings;

import at.htl.user.User;
import jakarta.persistence.*;

@Entity
@Table(name = "user_notification_settings")
public class UserNotificationSettings {

    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    @Column(name = "email_enabled", nullable = false)
    private boolean emailEnabled = true;

    @Column(name = "push_enabled", nullable = false)
    private boolean pushEnabled = true;

    @Column(name = "sms_enabled", nullable = false)
    private boolean smsEnabled = true;

    @Column(name = "in_app_enabled", nullable = false)
    private boolean inAppEnabled = true;

    @Column(name = "party_invites", nullable = false)
    private boolean partyInvites = true;

    @Column(name = "party_updates", nullable = false)
    private boolean partyUpdates = true;

    @Column(name = "follow_events", nullable = false)
    private boolean followEvents = true;

    /** Master switch: off delivers nothing informational but keeps the values below. */
    @Column(name = "all_enabled", nullable = false)
    private boolean allEnabled = true;

    @Column(name = "invitation_responses", nullable = false)
    private boolean invitationResponses = true;

    @Column(name = "party_cancellations", nullable = false)
    private boolean partyCancellations = true;

    @Column(name = "unfollows", nullable = false)
    private boolean unfollows = true;

    public UserNotificationSettings() {
    }

    public UserNotificationSettings(User user) {
        this.user = user;
        this.id = user.getId();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public boolean isEmailEnabled() {
        return emailEnabled;
    }

    public void setEmailEnabled(boolean emailEnabled) {
        this.emailEnabled = emailEnabled;
    }

    public boolean isPushEnabled() {
        return pushEnabled;
    }

    public void setPushEnabled(boolean pushEnabled) {
        this.pushEnabled = pushEnabled;
    }

    public boolean isSmsEnabled() {
        return smsEnabled;
    }

    public void setSmsEnabled(boolean smsEnabled) {
        this.smsEnabled = smsEnabled;
    }

    public boolean isInAppEnabled() {
        return inAppEnabled;
    }

    public void setInAppEnabled(boolean inAppEnabled) {
        this.inAppEnabled = inAppEnabled;
    }

    public boolean isPartyInvites() {
        return partyInvites;
    }

    public void setPartyInvites(boolean partyInvites) {
        this.partyInvites = partyInvites;
    }

    public boolean isPartyUpdates() {
        return partyUpdates;
    }

    public void setPartyUpdates(boolean partyUpdates) {
        this.partyUpdates = partyUpdates;
    }

    public boolean isFollowEvents() {
        return followEvents;
    }

    public void setFollowEvents(boolean followEvents) {
        this.followEvents = followEvents;
    }

    public boolean isAllEnabled() {
        return allEnabled;
    }

    public void setAllEnabled(boolean allEnabled) {
        this.allEnabled = allEnabled;
    }

    public boolean isInvitationResponses() {
        return invitationResponses;
    }

    public void setInvitationResponses(boolean invitationResponses) {
        this.invitationResponses = invitationResponses;
    }

    public boolean isPartyCancellations() {
        return partyCancellations;
    }

    public void setPartyCancellations(boolean partyCancellations) {
        this.partyCancellations = partyCancellations;
    }

    public boolean isUnfollows() {
        return unfollows;
    }

    public void setUnfollows(boolean unfollows) {
        this.unfollows = unfollows;
    }

    /** Informational delivery of one category on one channel; a missing settings row means all defaults. */
    public static boolean allows(UserNotificationSettings settings, NotificationCategory category, boolean emailChannel) {
        if (settings == null) {
            return true;
        }
        if (!settings.allEnabled || !(emailChannel ? settings.emailEnabled : settings.inAppEnabled)) {
            return false;
        }
        return switch (category) {
            case PARTY_INVITES -> settings.partyInvites;
            case INVITATION_RESPONSES -> settings.invitationResponses;
            case PARTY_UPDATES -> settings.partyUpdates;
            case PARTY_CANCELLATIONS -> settings.partyCancellations;
            case FOLLOW_EVENTS -> settings.followEvents;
            case UNFOLLOWS -> settings.unfollows;
        };
    }
}
