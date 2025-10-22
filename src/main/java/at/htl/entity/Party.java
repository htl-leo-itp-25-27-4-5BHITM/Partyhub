package at.htl.entity;

import jakarta.persistence.*;

import java.sql.Timestamp;

@Entity
@Table(name="party")
public class Party {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long party_id;
    private Long host_user_id;
    private Long category_id;
    private Timestamp time_start;
    private Timestamp time_end;
    private int max_people;
    private int min_age;
    private int max_age;

    public Long getParty_id() {
        return party_id;
    }

    public void setParty_id(Long party_id) {
        this.party_id = party_id;
    }

    public Long getHost_user_id() {
        return host_user_id;
    }

    public void setHost_user_id(Long host_user_id) {
        this.host_user_id = host_user_id;
    }

    public Long getCategory_id() {
        return category_id;
    }

    public void setCategory_id(Long category_id) {
        this.category_id = category_id;
    }

    public Timestamp getTime_start() {
        return time_start;
    }

    public void setTime_start(Timestamp time_start) {
        this.time_start = time_start;
    }

    public Timestamp getTime_end() {
        return time_end;
    }

    public void setTime_end(Timestamp time_end) {
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
}
