package at.htl.entity;

import jakarta.persistence.*;

@Entity
@Table(name="friendship_status")
public class FriendshipStatus {
    public FriendshipStatus(){}

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getStatus_id() {
        return status_id;
    }

    public void setStatus_id(Long status_id) {
        this.status_id = status_id;
    }

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long status_id;
    private String name;
    public FriendshipStatus(String name){
        setName(name);
    }
}
