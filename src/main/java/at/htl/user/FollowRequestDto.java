package at.htl.user;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

/** A pending incoming follow request: the bounded requester summary plus when it was sent. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record FollowRequestDto(Long id, String displayName, String distinctName, String biography,
                               LocalDateTime requestedAt) {
    public static FollowRequestDto from(User requester, LocalDateTime requestedAt) {
        return new FollowRequestDto(requester.getId(), requester.getDisplayName(), requester.getDistinctName(),
                requester.getBiography(), requestedAt);
    }
}
