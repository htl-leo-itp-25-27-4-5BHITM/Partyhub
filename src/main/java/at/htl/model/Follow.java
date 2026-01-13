package at.htl.model;

import jakarta.persistence.*;

@Entity
@TableGenerator(name="follow")
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
}
