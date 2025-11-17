package at.htl.entity;

import jakarta.persistence.*;
@Entity
@Table(name = "party_attendees")
public class PartyAttendees {
    @Id
    @Column(name = "party_id")
    private Long partyId;

    @Id
    @Column(name = "user_id")
    private Long userId;

    public PartyAttendees(){

    }
    public PartyAttendees(Long partyId, Long userId) {
        setPartyId(partyId);
        setUserId(userId);
    }

    public Long getPartyId() {
        return partyId;
    }

    public void setPartyId(Long partyId) {
        this.partyId = partyId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
