package at.htl.dto;

import java.time.LocalDateTime;
import java.util.Set;

public record PartyCreateDto(
        String title,
        String description,
        Double fee,
        String time_start,
        String time_end,
        Integer max_people,
        Integer min_age,
        Integer max_age,
        String website,
        Double latitude,
        Double longitude,
        Long category_id ){ }
