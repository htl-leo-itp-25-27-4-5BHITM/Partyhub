package at.htl.party;

public record InvitedMemberDto(
        Long userId,
        String username,
        String displayName,
        String distinctName,
        String status
) {
}
