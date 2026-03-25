package at.htl.user;

import at.htl.party.Party;
import at.htl.profile_picture.ProfilePicture;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.Set;
import java.util.UUID;

@Entity
@Table(name="users")
public class User {

    public User() {
    }

    public User(UUID id) {
        this.id = id;
    }

    @Id
    private UUID id;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "distinct_name")
    private String distinctName;

    private String email;

    @Column(nullable = true)
    private String biography;

    @OneToOne(cascade = CascadeType.ALL, mappedBy = "user")
    @JsonIgnore
    private ProfilePicture profilePicture;

    @ManyToMany(mappedBy = "users")
    @JsonIgnore
    private Set<Party> party;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getBiography() {
        return biography;
    }

    public void setBiography(String biography) {
        this.biography = biography;
    }

    public ProfilePicture getProfilePicture() {
        return profilePicture;
    }

    //TODO: Delete old ProfilePicture before applying the new ProfilePicture
    public void setProfilePicture(ProfilePicture profilePicture) {
        this.profilePicture = profilePicture;
    }

    public Set<Party> getParty() {
        return party;
    }

    public void setParty(Set<Party> party) {
        this.party = party;
    }
}