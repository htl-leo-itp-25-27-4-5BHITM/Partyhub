package at.htl.invitation;

import at.htl.party.Party;
import at.htl.user.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;

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

    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    @JoinColumn(name = "sender_id")
    private User sender;
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    @JoinColumn(name = "recipient_id")
    private User recipient;
    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    @JoinColumn(name = "party_id")
    private Party party;

    @Column(nullable = false)
    private String status = "PENDING";


    public void setParty(Party party) {
        this.party = party;
    }


    public void setRecipient(User recipient) {
        this.recipient = recipient;
    }

   

    public void setSender(User sender) {
        this.sender = sender;
    }

    public User getSender() {
        return sender;
    }

    public User getRecipient() {
        return recipient;
    }

    public Party getParty() {
        return party;
    }

    public String getStatus() {
        return status == null ? "PENDING" : status;
    }

    public void setStatus(String status) {
        this.status = status == null || status.isBlank() ? "PENDING" : status;
    }

    @JsonProperty("sender_id")
    public Long getSenderId() {
        return sender != null ? sender.getId() : null;
    }

    @JsonProperty("recipient_id")
    public Long getRecipientId() {
        return recipient != null ? recipient.getId() : null;
    }

    @JsonProperty("party_id")
    public Long getPartyId() {
        return party != null ? party.getId() : null;
    }

    public Invitation() {

    }
}
