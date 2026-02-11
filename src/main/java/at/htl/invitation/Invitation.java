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


    public void setParty(Party party) {
        this.party = party;
    }


    public void setRecipient(User recipient) {
        this.recipient = recipient;
    }

   

    public void setSender(User sender) {
        this.sender = sender;
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
