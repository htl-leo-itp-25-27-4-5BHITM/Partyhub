package at.htl.invitation;

import java.util.UUID;

public record InvitationDto(UUID recipient, Long partyId) {
}
