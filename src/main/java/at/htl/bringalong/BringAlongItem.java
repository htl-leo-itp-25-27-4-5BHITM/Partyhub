package at.htl.bringalong;

import at.htl.party.Party;
import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import java.time.LocalDateTime;

@Entity
@Table(name = "bring_along_item")
public class BringAlongItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "party_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    Party party;

    @Column(nullable = false, length = 100)
    String name;

    @Column(length = 30)
    String unit;

    @Column(nullable = false)
    int quantity;

    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt;
}
