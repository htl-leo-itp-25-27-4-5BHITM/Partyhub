package at.htl.party;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class LocationDto {
    private Long id;
    private String address;
    private Double latitude;
    private Double longitude;

    public LocationDto() {}

    public LocationDto(at.htl.location.Location location) {
        if (location != null) {
            this.id = location.getId();
            this.address = location.getAddress();
            this.latitude = location.getLatitude();
            this.longitude = location.getLongitude();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}