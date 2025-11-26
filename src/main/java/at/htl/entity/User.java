package at.htl.entity;

import jakarta.persistence.*;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Entity
@Table(name="user_account")
@TableGenerator(name="user_account")

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
}
