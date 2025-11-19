package at.htl.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@TableGenerator(name = "party")
@Table(name = "party")
public class Party {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    private User host_user;
    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;
    private String title;
    private LocalDateTime time_start;
    private LocalDateTime time_end;
    private int max_people;
    private int min_age;
    private int max_age;
    private String description;
    private Double latitude;
    private Double longitude;
    private Double fee;
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime created_at;

    public Party() {}

    public Party(User host_user, Category category, String title, LocalDateTime time_start, LocalDateTime time_end, int max_people, int min_age, int max_age, String description, Double latitude, Double longitude, Double fee) {
        this.host_user = host_user;
        this.category = category;
        this.title = title;
        this.time_start = time_start;
        this.time_end = time_end;
        this.max_people = max_people;
        this.min_age = min_age;
        this.max_age = max_age;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.fee = fee;
    }

    @Override
    public String toString() {
        return "Party{" +
                "id=" + id +
                ", host_user=" + host_user +
                ", category=" + category +
                ", title='" + title + '\'' +
                ", time_start=" + time_start +
                ", time_end=" + time_end +
                ", max_people=" + max_people +
                ", min_age=" + min_age +
                ", max_age=" + max_age +
                ", description='" + description + '\'' +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                ", fee=" + fee +
                ", created_at=" + created_at +
                '}';
    }

    public static Party getPartyById(Long party_id, EntityManager entityManager) {
        return entityManager.find(Party.class, party_id);
    }


}
