package at.htl.model;

import jakarta.persistence.*;

@Entity
@TableGenerator(name="friendship_status")
@Table(name="friendship_status")
public class FriendshipStatus {
    @Id
    @Column(name = "id")
    private Long status_id;
    @Column(name = "name")
    private String name;

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


}
