package at.htl.model;

import jakarta.persistence.*;

@Entity
@TableGenerator(name="friendship")
@Table(name="friendship")
public class Friendship {
    public Friendship() {

    }
    @Id @Column(name = "user1_id")
    Long user1_id;
    @Id @Column(name = "user2_id")
    Long user2_id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    FriendshipStatus status;
}