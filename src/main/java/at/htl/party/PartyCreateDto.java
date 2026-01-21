package at.htl.party;

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
