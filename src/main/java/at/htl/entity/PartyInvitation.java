package at.htl.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "party_invitation")
public class PartyInvitation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUser1_id() {
        return user1_id;
    }

    public void setUser1_id(Long user1_id) {
        this.user1_id = user1_id;
    }

    public Long getParty_id() {
        return party_id;
    }

    public void setParty_id(Long party_id) {
        this.party_id = party_id;
    }

    public Long getUser2_id() {
        return user2_id;
    }

    public void setUser2_id(Long user2_id) {
        this.user2_id = user2_id;
    }

    private Long user1_id;
    private Long party_id;
    private Long user2_id;

    public PartyInvitation() {

    }

    public PartyInvitation(Long user1_id, Long user2_id, Long party_id) {
        setUser1_id(user1_id);
        setUser2_id(user2_id);
        setParty_id(party_id);
    }
}
