package at.htl.model;

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
    }

    public static User getUserById(Long id, EntityManager entityManager){
        return entityManager.find(User.class, id);
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String email;
    @Column(nullable = true)
    private String biography;

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
}

