package at.htl.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

import java.util.List;

@Entity
public class Location {
    @Id
    private Long location_id;
    double longitude;
    double latitude;

    @OneToMany
    List<Party> partyList;

    public Long getLocation_id() {
        return location_id;
    }

    public void setLocation_id(Long location_id) {
        this.location_id = location_id;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public List<Party> getPartyList() {
        return partyList;
    }

    public void setPartyList(List<Party> partyList) {
        this.partyList = partyList;
    }
}
