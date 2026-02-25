package at.htl.profile_picture;

import at.htl.party.Party;
import at.htl.user.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.Set;

@Entity
@Table(name="profile_picture")
@TableGenerator(name="profile_picture")
public class ProfilePicture {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "picture_name", nullable = true)
    private String picture_name;
    @OneToOne(cascade = CascadeType.ALL)
    private User user;

    public ProfilePicture() {

    }

    public ProfilePicture( String picture_name, User user) {
        this.picture_name = picture_name;
        this.user = user;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPicture_name() {
        return picture_name;
    }

    public void setPicture_name(String picture_name) {
        this.picture_name = picture_name;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}