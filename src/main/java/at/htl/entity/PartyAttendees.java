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
}
