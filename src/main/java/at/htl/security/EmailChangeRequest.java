package at.htl.security;

import at.htl.user.User;
import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.OffsetDateTime;

/** The one pending e-mail change of a user. Ending the change deletes the row, which kills both links. */
@Entity
@Table(name = "email_change_request")
public class EmailChangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @Column(name = "new_email", nullable = false, length = 254)
    private String newEmail;

    @Column(name = "confirm_token_hash", nullable = false, unique = true, length = 64)
    private String confirmTokenHash;

    @Column(name = "cancel_token_hash", nullable = false, unique = true, length = 64)
    private String cancelTokenHash;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getNewEmail() {
        return newEmail;
    }

    public void setNewEmail(String newEmail) {
        this.newEmail = newEmail;
    }

    public String getConfirmTokenHash() {
        return confirmTokenHash;
    }

    public void setConfirmTokenHash(String confirmTokenHash) {
        this.confirmTokenHash = confirmTokenHash;
    }

    public String getCancelTokenHash() {
        return cancelTokenHash;
    }

    public void setCancelTokenHash(String cancelTokenHash) {
        this.cancelTokenHash = cancelTokenHash;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(OffsetDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }
}
