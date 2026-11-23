package at.htl.dashboard;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.Arrays;
import java.util.Optional;

/** The fixed time ranges the dashboard supports. */
public enum DashboardRange {
    DAYS_7("7d", Bucket.DAY),
    DAYS_30("30d", Bucket.DAY),
    MONTHS_3("3m", Bucket.WEEK),
    MONTHS_6("6m", Bucket.WEEK);

    public static final DashboardRange DEFAULT = DAYS_30;

    public enum Bucket { DAY, WEEK }

    private final String key;
    private final Bucket bucket;

    DashboardRange(String key, Bucket bucket) {
        this.key = key;
        this.bucket = bucket;
    }

    public String key() {
        return key;
    }

    public Bucket bucket() {
        return bucket;
    }

    /** Empty when the value is not one of the supported keys; the default when the value is missing. */
    public static Optional<DashboardRange> parse(String value) {
        if (value == null || value.isBlank()) {
            return Optional.of(DEFAULT);
        }
        return Arrays.stream(values()).filter(r -> r.key.equals(value.trim())).findFirst();
    }

    /** First day of the range: whole calendar days for day ranges, the Monday of the start week for month ranges. */
    public LocalDate startDate(LocalDate today) {
        return switch (this) {
            case DAYS_7 -> today.minusDays(6);
            case DAYS_30 -> today.minusDays(29);
            case MONTHS_3 -> today.minusMonths(3).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            case MONTHS_6 -> today.minusMonths(6).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        };
    }

    public LocalDateTime start(LocalDateTime now) {
        return startDate(now.toLocalDate()).atStartOfDay();
    }
}
