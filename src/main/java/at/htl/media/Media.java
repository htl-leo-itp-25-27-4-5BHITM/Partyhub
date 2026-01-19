package at.htl.media;

import at.htl.party.Party;
import at.htl.user.User;
import jakarta.persistence.*;

@Entity
@TableGenerator(name="media")
@Table(name="media")
public class Media {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "party_id")
    private Party party;
    @ManyToOne
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
