package at.htl.party;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class PartyDto {
    private Long id;
    private String title;
    private String description;
    private Double fee;
    private String website;
    private String visibility;
    private LocalDateTime time_start;
    private LocalDateTime time_end;
    private int min_age;
    private int max_age;
    private int max_people;
    private LocalDateTime created_at;
    private Long host_user_id;
    private String host_user_name;
    private String host_user_distinct_name;
    private LocationDto location;
    private CategoryDto category;
    private int attendeeCount;
    
    // Convenience fields for frontend
    public String getLocation_address() {
        return location != null ? location.getAddress() : null;
    }

    public PartyDto() {}

    public PartyDto(Party party) {
        this.id = party.getId();
        this.title = party.getTitle();
        this.description = party.getDescription();
        this.fee = party.getFee();
        this.website = party.getWebsite();
        this.visibility = party.getVisibility();
        this.time_start = party.getTime_start();
        this.time_end = party.getTime_end();
        this.min_age = party.getMin_age();
        this.max_age = party.getMax_age();
        this.max_people = party.getMax_people();
        this.created_at = party.getCreated_at();
        
        if (party.getHost_user() != null) {
            this.host_user_id = party.getHost_user().getId();
            this.host_user_name = party.getHost_user().getDisplayName();
            this.host_user_distinct_name = party.getHost_user().getDistinctName();
        }
        
        if (party.getLocation() != null) {
            this.location = new LocationDto(party.getLocation());
        }
        
        if (party.getCategory() != null) {
            this.category = new CategoryDto(party.getCategory());
        }
        
        if (party.getUsers() != null) {
            this.attendeeCount = party.getUsers().size();
        } else {
            this.attendeeCount = 0;
        }
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Double getFee() { return fee; }
    public void setFee(Double fee) { this.fee = fee; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }

    public LocalDateTime getTime_start() { return time_start; }
    public void setTime_start(LocalDateTime time_start) { this.time_start = time_start; }

    public LocalDateTime getTime_end() { return time_end; }
    public void setTime_end(LocalDateTime time_end) { this.time_end = time_end; }

    public int getMin_age() { return min_age; }
    public void setMin_age(int min_age) { this.min_age = min_age; }

    public int getMax_age() { return max_age; }
    public void setMax_age(int max_age) { this.max_age = max_age; }

    public int getMax_people() { return max_people; }
    public void setMax_people(int max_people) { this.max_people = max_people; }

    public LocalDateTime getCreated_at() { return created_at; }
    public void setCreated_at(LocalDateTime created_at) { this.created_at = created_at; }

    public Long getHost_user_id() { return host_user_id; }
    public void setHost_user_id(Long host_user_id) { this.host_user_id = host_user_id; }

    public String getHost_user_name() { return host_user_name; }
    public void setHost_user_name(String host_user_name) { this.host_user_name = host_user_name; }

    public String getHost_user_distinct_name() { return host_user_distinct_name; }
    public void setHost_user_distinct_name(String host_user_distinct_name) { this.host_user_distinct_name = host_user_distinct_name; }

    public LocationDto getLocation() { return location; }
    public void setLocation(LocationDto location) { this.location = location; }

    public CategoryDto getCategory() { return category; }
    public void setCategory(CategoryDto category) { this.category = category; }

    public int getAttendeeCount() { return attendeeCount; }
    public void setAttendeeCount(int attendeeCount) { this.attendeeCount = attendeeCount; }
}