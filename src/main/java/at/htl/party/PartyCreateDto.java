package at.htl.party;

// FIX: Use the Jackson version for JSON mapping
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;

public record PartyCreateDto(
        String title,
        String description,
        Double fee,

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime time_start,

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime time_end,

        Integer max_people,
        Integer min_age,
        Integer max_age,
        String website,
        Double latitude,
        Double longitude,
        String location_address,
        Long category_id,
        String theme,
        String visibility,
        List<String> selectedUsers
) { }