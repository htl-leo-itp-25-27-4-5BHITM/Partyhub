package at.htl.entity;

import jakarta.persistence.*;

@Entity
@TableGenerator(name="party_media")
@Table(name="party_media")
public class Media {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "media_id")
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    private Party party;
    @ManyToOne(fetch = FetchType.LAZY)
    private User user;
    @Column(name = "url")
    private String url;

    public Media() {
    }

    public Media(Party party, User user, String url) {
        this.party = party;
        this.user = user;
        this.url = url;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Party getParty() {
        return party;
    }

    public void setParty(Party party) {
        this.party = party;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
