package at.htl.entity;

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
    @Column(name = "status_id")
    Long status_id;
}