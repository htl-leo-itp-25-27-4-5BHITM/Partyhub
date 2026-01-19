package at.htl.user;

import at.htl.party.Party;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.Set;

@Entity
@Table(name="users")
@TableGenerator(name="users")
@Inheritance(strategy = InheritanceType.JOINED)
public class User {
    public User(){

    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "display_name")
    private String displayName;
    @Column(name = "distinct_name")
    private String distinctName;
    private String email;
    @Column(nullable = true)
    private String biography;

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

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getDistinctName() {
        return distinctName;
    }

    public void setDistinctName(String distinctName) {
        this.distinctName = distinctName;
    }

    public String getProfileImage() {
        return profileImage;
    }

    public void setProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }
}
