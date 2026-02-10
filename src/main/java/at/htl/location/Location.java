package at.htl.location;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name="location")
public class Location {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonIgnore
    private Long id;

    private double longitude;
    private double latitude;
    private String address;

    public Location() {
    }

    // Getter und Setter
    public String getAddress() { return address; }
    public void setAddress(String name) { this.address = name; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
}