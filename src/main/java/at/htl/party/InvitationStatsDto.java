package at.htl.party;

public record InvitationStatsDto(
    long totalInvited,
    long accepted,
    long declined,
    long pending,
    double acceptedRatio
) {
}
