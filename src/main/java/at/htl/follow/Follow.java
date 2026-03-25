package at.htl.follow;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@TableGenerator(name="follow")
@Table(name="follow")
public class Follow {
    public Follow() {

    }
    @Id
    @Column(name = "user1_id")
    UUID user1_id;
    @Id
    @Column(name = "user2_id")
    UUID user2_id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    FollowStatus status;

    public UUID getUser1_id() {
        return user1_id;
    }

    public void setUser1_id(UUID user1_id) {
        this.user1_id = user1_id;
    }

    public UUID getUser2_id() {
        return user2_id;
    }

    public void setUser2_id(UUID user2_id) {
        this.user2_id = user2_id;
    }

    public FollowStatus getStatus() {
        return status;
    }

    public void setStatus(FollowStatus status) {
        this.status = status;
    }
}
