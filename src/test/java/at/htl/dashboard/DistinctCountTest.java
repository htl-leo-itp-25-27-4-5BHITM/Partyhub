package at.htl.dashboard;

import at.htl.dashboard.DashboardService.FollowRow;
import at.htl.dashboard.DashboardService.JoinRow;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static at.htl.history.FollowEventType.FOLLOWED;
import static at.htl.history.FollowEventType.UNFOLLOWED;
import static org.junit.jupiter.api.Assertions.assertEquals;

class DistinctCountTest {

    static final LocalDateTime T = LocalDateTime.of(2026, 11, 1, 12, 0);

    @Test
    void sameFollowerManyTimesCountsOnce() {
        List<FollowRow> rows = new ArrayList<>();
        for (int i = 0; i < 22; i++) {
            rows.add(new FollowRow(9, FOLLOWED, T.plusDays(i)));
        }

        List<FollowRow> counted = DashboardService.oncePerFollower(rows);

        assertEquals(List.of(new FollowRow(9, FOLLOWED, T)), counted, "only the first follow counts");
    }

    @Test
    void followerCountsOnceAsGainedAndOnceAsLost() {
        List<FollowRow> rows = List.of(
                new FollowRow(9, FOLLOWED, T),
                new FollowRow(9, UNFOLLOWED, T.plusDays(2)),
                new FollowRow(9, FOLLOWED, T.plusDays(4)),
                new FollowRow(9, UNFOLLOWED, T.plusDays(6)));

        List<FollowRow> counted = DashboardService.oncePerFollower(rows);

        assertEquals(List.of(new FollowRow(9, FOLLOWED, T), new FollowRow(9, UNFOLLOWED, T.plusDays(6))), counted);
    }

    @Test
    void differentFollowersAreCountedSeparately() {
        List<FollowRow> rows = List.of(
                new FollowRow(1, FOLLOWED, T),
                new FollowRow(2, FOLLOWED, T.plusHours(1)),
                new FollowRow(1, FOLLOWED, T.plusHours(2)));

        assertEquals(2, DashboardService.oncePerFollower(rows).size());
    }

    @Test
    void sameGuestJoiningSamePartyTwiceCountsOnce() {
        List<JoinRow> rows = List.of(
                new JoinRow(5, 3, "PUBLIC", T.plusDays(3)),
                new JoinRow(5, 3, "PUBLIC", T),
                new JoinRow(6, 3, "PRIVATE", T.plusDays(1)),
                new JoinRow(5, 4, "PUBLIC", T.plusDays(2)));

        List<JoinRow> counted = DashboardService.firstJoinPerGuestAndParty(rows);

        assertEquals(3, counted.size(), "guest 3 counts once for party 5 and once for party 6");
        assertEquals(T, counted.stream().filter(r -> r.partyId() == 5 && r.userId() == 3).findFirst().orElseThrow().occurredAt());
    }
}
