package at.htl.model;

import jakarta.persistence.*;

@Entity
@Table(name = "invitation")
@TableGenerator(name = "invitation")
public class Invitation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id")
    private User sender;
    @OneToOne
    @JoinColumn(name = "id")
    private User recipient;
    @ManyToOne
    @JoinColumn(name = "party_id")
    private Party party;

    public Party getParty() {
        return party;
    }

    public void setParty(Party party) {
        this.party = party;
    }

    public User getRecipient() {
        return recipient;
    }

    public void setRecipient(User recipient) {
        this.recipient = recipient;
    }

    public User getSender() {
        return sender;
    }

    public void setSender(User sender) {
        this.sender = sender;
    }

    public Invitation() {

    }
}
