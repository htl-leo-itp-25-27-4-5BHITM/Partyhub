package at.htl.entity;

import jakarta.persistence.*;
@Entity
@TableGenerator(name = "party_attendees")
@Table(name = "party_attendees")
public class PartyAttendees {

    public PartyAttendees(Party party, User user){
        this.party = party;
        this.user = user;
    }


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Party party;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    public PartyAttendees(){

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
}
