package at.htl.dashboard;

import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class DashboardRangeTest {

    @Test
    void parsesSupportedKeys() {
        assertEquals(DashboardRange.DAYS_7, DashboardRange.parse("7d").orElseThrow());
        assertEquals(DashboardRange.DAYS_30, DashboardRange.parse("30d").orElseThrow());
        assertEquals(DashboardRange.MONTHS_3, DashboardRange.parse("3m").orElseThrow());
        assertEquals(DashboardRange.MONTHS_6, DashboardRange.parse("6m").orElseThrow());
    }

    @Test
    void missingRangeFallsBackTo30Days() {
        assertEquals(DashboardRange.DAYS_30, DashboardRange.parse(null).orElseThrow());
        assertEquals(DashboardRange.DAYS_30, DashboardRange.parse(" ").orElseThrow());
    }

    @Test
    void unknownRangeIsRejected() {
        assertTrue(DashboardRange.parse("1y").isEmpty());
        assertTrue(DashboardRange.parse("7").isEmpty());
    }

    @Test
    void dayRangesCoverWholeCalendarDaysIncludingToday() {
        LocalDateTime now = LocalDateTime.of(2026, 11, 23, 15, 30);
        assertEquals(LocalDateTime.of(2026, 11, 17, 0, 0), DashboardRange.DAYS_7.start(now));
        assertEquals(LocalDateTime.of(2026, 10, 25, 0, 0), DashboardRange.DAYS_30.start(now));
    }

    @Test
    void monthRangesStartOnMonday() {
        LocalDate today = LocalDate.of(2026, 11, 23);
        LocalDate start3 = DashboardRange.MONTHS_3.startDate(today);
        LocalDate start6 = DashboardRange.MONTHS_6.startDate(today);
        assertEquals(DayOfWeek.MONDAY, start3.getDayOfWeek());
        assertEquals(DayOfWeek.MONDAY, start6.getDayOfWeek());
        assertFalse(start3.isAfter(today.minusMonths(3)));
        assertTrue(start3.isAfter(today.minusMonths(3).minusDays(7)));
        assertFalse(start6.isAfter(today.minusMonths(6)));
    }
}
