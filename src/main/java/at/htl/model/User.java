package at.htl.model;

import at.htl.dto.InvitationDto;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Entity
@Table(name="users")
@TableGenerator(name="users")
@Inheritance(strategy = InheritanceType.JOINED)
public class User {
    public User(){}
    public User(JsonWebToken jwt) {
        this.name = jwt.getName();
        this.email = jwt.getClaim("email");
        // default profile image filename (stored without path)
        this.profileImage = "profile_picture.jpg";
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String email;
    @Column(nullable = true)
    private String biography;

    // new field for profile image filename (only filename)
    @Column(name = "profile_picture", nullable = true)
    private String profileImage;

    @ManyToMany(mappedBy = "users")
    @JsonIgnore
    private Set<Party> party;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getBiography() {
        return biography;
    }

    public void setBiography(String biography) {
        this.biography = biography;
    }

    public Set<Party> getParty() {
        return party;
    }

    public void setParty(Set<Party> party) {
        this.party = party;
    }

    public String getProfileImage() {
        return profileImage;
    }

    public void setProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }

    @PrePersist
    @PreUpdate
    private void ensureProfileImage() {
        if (this.profileImage == null || this.profileImage.isBlank()) {
            this.profileImage = "profile_picture3.jpg";
        }
    }
}
