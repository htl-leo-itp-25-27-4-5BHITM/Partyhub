package at.htl.media;

import at.htl.party.Party;
import at.htl.user.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

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
    /** Null for items stored before upload times were recorded. */
    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    public Media() {

    }

    public Media(Party party, User user, String file) {
        this.party = party;
        this.user = user;
        this.file = file;
        this.uploadedAt = LocalDateTime.now();
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

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public String getUrl() {
        return file;
    }
}
