package at.htl.history;

import at.htl.user.User;
import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

/** One accepted follow starting or ending; used for follower statistics over time. */
@Entity
@Table(name = "follow_event")
public class FollowEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    User follower;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "followed_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    User followed;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    FollowEventType type;

    @Column(name = "occurred_at", nullable = false)
    LocalDateTime occurredAt;

    public FollowEvent() {
    }

    public FollowEvent(User follower, User followed, FollowEventType type, LocalDateTime occurredAt) {
        this.follower = follower;
        this.followed = followed;
        this.type = type;
        this.occurredAt = occurredAt;
    }

    public Long getId() { return id; }
    public User getFollower() { return follower; }
    public User getFollowed() { return followed; }
    public FollowEventType getType() { return type; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
}
