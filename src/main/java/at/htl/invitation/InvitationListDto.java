package at.htl.invitation;

public record InvitationListDto(
    Long id,
    Long senderId,
    String senderUsername,
    String senderDisplayName,
    Long recipientId,
    Long partyId,
    String partyTitle,
    String status
) {
    public static InvitationListDto from(Invitation invitation) {
        return new InvitationListDto(
            invitation.getId(),
            invitation.getSender() != null ? invitation.getSender().getId() : null,
            invitation.getSender() != null ? invitation.getSender().getUsername() : null,
            invitation.getSender() != null ? invitation.getSender().getDisplayName() : null,
            invitation.getRecipient() != null ? invitation.getRecipient().getId() : null,
            invitation.getParty() != null ? invitation.getParty().getId() : null,
            invitation.getParty() != null ? invitation.getParty().getTitle() : null,
            invitation.getStatus()
        );
    }
}
