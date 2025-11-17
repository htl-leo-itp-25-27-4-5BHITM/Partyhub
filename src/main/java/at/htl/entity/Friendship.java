package at.htl.entity;

import jakarta.persistence.*;

@Entity
@Table(name="friendship")
public class Friendship {
    public Friendship() {

    }
    @Id
    Long user1_id;
    @Id
    Long user2_id;

    @OneToOne(cascade = CascadeType.ALL)
    FriendshipStatus status;

    public FriendshipStatus getStatus() {
        return status;
    }

    public void setStatus(FriendshipStatus status) {
        this.status = status;
    }
}