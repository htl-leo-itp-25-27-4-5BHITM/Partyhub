package at.htl.follow;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name="follow")
public class Follow {
    public Follow() {

    }
    @Id
    @Column(name = "user1_id")
    Long user1_id;
    @Id
    @Column(name = "user2_id")
    Long user2_id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    FollowStatus status;
    /** When the follow request was sent; null for requests from before this was recorded. */
    @Column(name = "requested_at")
    LocalDateTime requestedAt;

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public Long getUser1_id() {
        return user1_id;
    }

    public void setUser1_id(Long user1_id) {
        this.user1_id = user1_id;
    }

    public Long getUser2_id() {
        return user2_id;
    }

    public void setUser2_id(Long user2_id) {
        this.user2_id = user2_id;
    }

    public FollowStatus getStatus() {
        return status;
    }

    public void setStatus(FollowStatus status) {
        this.status = status;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof Follow follow)) {
            return false;
        }
        return Objects.equals(user1_id, follow.user1_id)
                && Objects.equals(user2_id, follow.user2_id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(user1_id, user2_id);
    }
}
