package at.htl.history;

import at.htl.party.Party;
import at.htl.user.User;
import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

/** One user joining or leaving a party; used for join statistics over time. */
@Entity
@Table(name = "attendance_event")
public class AttendanceEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "party_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    Party party;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    AttendanceEventType type;

    @Column(name = "occurred_at", nullable = false)
    LocalDateTime occurredAt;

    public AttendanceEvent() {
    }

    public AttendanceEvent(Party party, User user, AttendanceEventType type, LocalDateTime occurredAt) {
        this.party = party;
        this.user = user;
        this.type = type;
        this.occurredAt = occurredAt;
    }

    public Long getId() { return id; }
    public Party getParty() { return party; }
    public User getUser() { return user; }
    public AttendanceEventType getType() { return type; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
}
