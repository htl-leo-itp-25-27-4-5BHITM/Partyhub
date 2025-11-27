package at.htl.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Entity
@TableGenerator(name = "party")
@Table(name = "party")
public class Party {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_user_id")
    private User host_user;
    private String title;
    private String description;
    private Double fee;
    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;
    private LocalDateTime time_start;
    private LocalDateTime time_end;
    private int max_people;
    private int min_age;
    private int max_age;
    @Column(nullable = true)
    private String website;
    private Double latitude;
    private Double longitude;
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime created_at;

    @OneToMany(mappedBy = "party",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.EAGER)
    @JsonIgnore
    private List<Media> media = new ArrayList<>();

    @JsonIgnore
    @ManyToMany
    @JoinTable(
            name = "party_user",
            joinColumns = @JoinColumn(name = "party_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> users;

    public Party() {
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

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
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
    public List<Media> getMedia() {
        return media;
    }

    public Set<User> getUsers() {
        return users;
    }

    public void setUsers(Set<User> users) {
        this.users = users;
    }

    public void setMedia(List<Media> media) {
        this.media = media;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }
}
