package at.htl.entity;

import jakarta.persistence.*;
@Entity
@Table(name="user_account")
public class User {
    public User(){}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long user_id;
    private String name;
    private String email;

    public Long getId() { return user_id; }
    public void setId(Long id) { this.user_id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
