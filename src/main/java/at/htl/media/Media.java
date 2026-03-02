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
    @JoinColumn(name = "user_id")
    private User user;
    @Column(name = "file")
    private String file;

    public Media() {

    }

    public Media(Party party, User user, String file) {
        this.party = party;
        this.user = user;
        this.file = file;
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

    public String getFile() {
        return file;
    }

    public void setFile(String file) {
        this.file = file;
    }
}
