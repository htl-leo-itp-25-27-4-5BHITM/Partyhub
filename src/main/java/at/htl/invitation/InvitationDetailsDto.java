package at.htl.invitation;

import at.htl.party.InvitationStatsDto;
import at.htl.party.Party;
import at.htl.user.User;

import java.time.LocalDateTime;

public record InvitationDetailsDto(
    Long invitationId,
    String status,
    Long partyId,
    String partyTitle,
    String partyDescription,
    LocalDateTime partyTimeStart,
    LocalDateTime partyTimeEnd,
    String partyTheme,
    Double partyFee,
    String partyVisibility,
    Long hostId,
    String hostDisplayName
) {
    public static InvitationDetailsDto from(Invitation invitation, Party party, User host) {
        return new InvitationDetailsDto(
            invitation.getId(),
            invitation.getStatus(),
            party.getId(),
            party.getTitle(),
            party.getDescription(),
            party.getTime_start(),
            party.getTime_end(),
            party.getTheme(),
            party.getFee(),
            party.getVisibility(),
            host.getId(),
            host.getDisplayName() != null ? host.getDisplayName() : host.getUsername()
        );
    }
}
