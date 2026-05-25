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
}
