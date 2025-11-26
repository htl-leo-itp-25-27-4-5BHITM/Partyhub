package at.htl.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@TableGenerator(name = "party")
@Table(name = "party")
public class Party {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
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

    private Double fee;
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime created_at;

    @ManyToOne
    Location location;

    public Party() {}

    public Party(Long id, User host_user, Category category, String title, LocalDateTime time_start, LocalDateTime time_end, int max_people, int min_age, int max_age, String description, Double fee, LocalDateTime created_at, Location location) {
        this.id = id;
        this.host_user = host_user;
        this.category = category;
        this.title = title;
        this.time_start = time_start;
        this.time_end = time_end;
        this.max_people = max_people;
        this.min_age = min_age;
        this.max_age = max_age;
        this.description = description;
        this.fee = fee;
        this.created_at = created_at;
        this.location = location;
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
                ", fee=" + fee +
                ", created_at=" + created_at +
                ", location=" + location +
                '}';
    }


    public static Party getPartyById(Long party_id, EntityManager entityManager) {
        return entityManager.find(Party.class, party_id);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getHost_user() {
        return host_user;
    }

    public void setHost_user(User host_user) {
        this.host_user = host_user;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public LocalDateTime getTime_start() {
        return time_start;
    }

    public void setTime_start(LocalDateTime time_start) {
        this.time_start = time_start;
    }

    public LocalDateTime getTime_end() {
        return time_end;
    }

    public void setTime_end(LocalDateTime time_end) {
        this.time_end = time_end;
    }

    public int getMax_people() {
        return max_people;
    }

    public void setMax_people(int max_people) {
        this.max_people = max_people;
    }

    public int getMin_age() {
        return min_age;
    }

    public void setMin_age(int min_age) {
        this.min_age = min_age;
    }

    public int getMax_age() {
        return max_age;
    }

    public void setMax_age(int max_age) {
        this.max_age = max_age;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Location getLocation() {
        return location;
    }

    public void setLocation(Location location) {
        this.location = location;
    }

    public Double getFee() {
        return fee;
    }

    public void setFee(Double fee) {
        this.fee = fee;
    }

    public LocalDateTime getCreated_at() {
        return created_at;
    }

    public void setCreated_at(LocalDateTime created_at) {
        this.created_at = created_at;
    }
}
