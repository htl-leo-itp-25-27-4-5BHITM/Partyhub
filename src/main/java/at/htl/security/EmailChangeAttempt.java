package at.htl.security;

import jakarta.persistence.*;

import java.time.OffsetDateTime;

/** One e-mail change request or resend, counted for the hourly rate limit. */
@Entity
@Table(name = "email_change_attempt")
public class EmailChangeAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "attempted_at", nullable = false)
    private OffsetDateTime attemptedAt;

    public EmailChangeAttempt() {
    }

    public EmailChangeAttempt(Long userId, OffsetDateTime attemptedAt) {
        this.userId = userId;
        this.attemptedAt = attemptedAt;
    }
}
