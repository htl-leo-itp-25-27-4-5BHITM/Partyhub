package at.htl.invitation;

import jakarta.validation.constraints.*;

public record InvitationDto(
        @NotNull(message = "Recipient ID is required")
        Long recipient,

        @NotNull(message = "Party ID is required")
        Long partyId
) {
}
