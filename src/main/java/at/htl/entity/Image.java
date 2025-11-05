package at.htl.entity;

import jakarta.persistence.*;

@Entity
@Table(name="party_image")
public class Image {
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getParty_id() {
        return party_id;
    }

    public void setParty_id(Long party_id) {
        this.party_id = party_id;
    }

    public Long getUser_id() {
        return user_id;
    }

    public void setUser_id(Long user_id) {
        this.user_id = user_id;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "img_id")
    Long id;
    @Column(name = "party_id")
    private Long party_id;

    @Column(name = "user_id")
    private Long user_id;

    @Column(name = "url")
    private String url;

    public Image() {

    }

    public Image(Long party_id, Long user_id, String url) {
        this.party_id = party_id;
        this.user_id = user_id;
        this.url = url;
    }
}
