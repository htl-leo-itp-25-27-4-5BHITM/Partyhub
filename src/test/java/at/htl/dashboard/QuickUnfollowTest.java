package at.htl.dashboard;

import at.htl.dashboard.DashboardService.FollowRow;
import at.htl.history.FollowEventType;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static at.htl.history.FollowEventType.FOLLOWED;
import static at.htl.history.FollowEventType.UNFOLLOWED;
import static org.junit.jupiter.api.Assertions.assertEquals;

class QuickUnfollowTest {

    static final LocalDateTime T = LocalDateTime.of(2026, 11, 20, 12, 0);

    private static FollowRow row(long follower, FollowEventType type, LocalDateTime at) {
        return new FollowRow(follower, type, at);
    }

    @Test
    void followUndoneWithin24HoursIsIgnored() {
        List<FollowRow> rows = List.of(row(1, FOLLOWED, T), row(1, UNFOLLOWED, T.plusMinutes(5)));
        assertEquals(List.of(), DashboardService.withoutQuickUnfollows(rows));
    }

    @Test
    void unfollowExactlyAfter24HoursIsStillIgnored() {
        List<FollowRow> rows = List.of(row(1, FOLLOWED, T), row(1, UNFOLLOWED, T.plusHours(24)));
        assertEquals(List.of(), DashboardService.withoutQuickUnfollows(rows));
    }

    @Test
    void unfollowAfterMoreThan24HoursCounts() {
        List<FollowRow> rows = List.of(row(1, FOLLOWED, T), row(1, UNFOLLOWED, T.plusHours(25)));
        assertEquals(rows, DashboardService.withoutQuickUnfollows(rows));
    }

    @Test
    void repeatedFollowUnfollowCyclesAreAllIgnoredButTheFinalFollowCounts() {
        FollowRow lastFollow = row(1, FOLLOWED, T.plusHours(3));
        List<FollowRow> rows = List.of(
                row(1, FOLLOWED, T), row(1, UNFOLLOWED, T.plusMinutes(1)),
                row(1, FOLLOWED, T.plusMinutes(2)), row(1, UNFOLLOWED, T.plusMinutes(3)),
                lastFollow);
        assertEquals(List.of(lastFollow), DashboardService.withoutQuickUnfollows(rows));
    }

    @Test
    void otherFollowersAreNotAffected() {
        FollowRow other = row(2, FOLLOWED, T.plusMinutes(1));
        List<FollowRow> rows = List.of(row(1, FOLLOWED, T), other, row(1, UNFOLLOWED, T.plusMinutes(2)));
        assertEquals(List.of(other), DashboardService.withoutQuickUnfollows(rows));
    }

    @Test
    void unfollowWithoutRecordedFollowCounts() {
        List<FollowRow> rows = List.of(row(1, UNFOLLOWED, T));
        assertEquals(rows, DashboardService.withoutQuickUnfollows(rows));
    }
}
