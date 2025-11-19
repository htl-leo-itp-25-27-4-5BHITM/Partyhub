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
}
