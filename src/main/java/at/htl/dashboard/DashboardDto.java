package at.htl.dashboard;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Host statistics for one time range. Contains only aggregates, never data about individual guests. */
public record DashboardDto(
        String range,
        LocalDateTime from,
        LocalDateTime to,
        long partiesCreated,
        long followersGained,
        long followersLost,
        long joins,
        VisibilitySplit visibility,
        InvitationStats invitations,
        Capacity capacity,
        TopParty topParty,
        Distribution gender,
        Distribution age,
        Timeline timeline) {

    public record VisibilityCount(long parties, long joins) {}

    public record VisibilitySplit(VisibilityCount privateParties, VisibilityCount publicParties) {}

    public record InvitationStats(long accepted, long declined, long pending) {}

    public record PartyCapacity(long partyId, String title, long guests, int maxPeople, double percent) {}

    /** {@code averagePercent} is null when no party in the range has a capacity limit. */
    public record Capacity(Double averagePercent, List<PartyCapacity> parties) {}

    public record TopParty(long partyId, String title, long guests, long favorites) {}

    /**
     * Percentages per category of guests who provided the value. When fewer than the threshold provided it,
     * {@code withheld} is true and {@code percentages} is empty.
     */
    public record Distribution(boolean withheld, int sampleSize, int minimumSampleSize, Map<String, Double> percentages) {}

    public record TimelinePoint(LocalDate start, long followersGained, long followersLost, long joins) {}

    public record Timeline(DashboardRange.Bucket bucket, List<TimelinePoint> points) {}
}
