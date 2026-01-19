package at.htl.follow;

import jakarta.persistence.*;

@Entity
@TableGenerator(name="follow_status")
@Table(name="follow_status")
public class FollowStatus {
    @Id
    @Column(name = "id")
    private Long status_id;
    @Column(name = "name")
    private String name;

    public FollowStatus(){}

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
