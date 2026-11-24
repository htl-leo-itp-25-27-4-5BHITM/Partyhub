package at.htl.dashboard;

import at.htl.dashboard.DashboardDto.*;
import at.htl.history.AttendanceEventType;
import at.htl.history.FollowEventType;
import at.htl.user.Gender;
import at.htl.user.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.owasp.encoder.Encode;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

/** Read-only aggregation of a host's statistics. All queries are bound to the given host. */
@ApplicationScoped
public class DashboardService {

    /** Gender and age distributions are only shown when at least this many guests provided the value. */
    public static final int MIN_SAMPLE = 5;

    /**
     * A follow that is undone within this time counts neither as a gained nor as a lost follower,
     * so following and unfollowing right away cannot inflate the dashboard.
     */
    static final Duration QUICK_UNFOLLOW_WINDOW = Duration.ofHours(24);

    static final List<String> AGE_GROUPS = List.of("<18", "18-20", "21-24", "25-29", "30+");

    @Inject
    EntityManager em;

    public DashboardDto build(long hostId, DashboardRange range, LocalDateTime now) {
        LocalDateTime from = range.start(now);

        List<PartyRow> parties = partiesCreated(hostId, from, now);
        List<FollowRow> follows = followEvents(hostId, from, now);
        List<JoinRow> joins = joins(hostId, from, now);

        long gained = follows.stream().filter(f -> f.type() == FollowEventType.FOLLOWED).count();
        long lost = follows.size() - gained;

        List<User> guests = distinctGuests(hostId, from, now);

        return new DashboardDto(
                range.key(), from, now,
                parties.size(), gained, lost, joins.size(),
                visibility(parties, joins),
                invitations(parties),
                capacity(parties),
                topParty(parties),
                genderDistribution(guests),
                ageDistribution(guests, now.toLocalDate()),
                timeline(range, from.toLocalDate(), now.toLocalDate(), follows, joins));
    }

    // ---------- queries ----------

    record PartyRow(long id, String title, String visibility, Integer maxPeople, long guests, LocalDateTime createdAt) {}

    record FollowRow(long followerId, FollowEventType type, LocalDateTime occurredAt) {}

    record JoinRow(long partyId, long userId, String visibility, LocalDateTime occurredAt) {}

    private List<PartyRow> partiesCreated(long hostId, LocalDateTime from, LocalDateTime to) {
        return em.createQuery(
                        "SELECT p.id, p.title, p.visibility, p.max_people, SIZE(p.users), p.created_at FROM Party p "
                                + "WHERE p.host_user.id = :hostId AND p.created_at >= :from AND p.created_at <= :to",
                        Object[].class)
                .setParameter("hostId", hostId)
                .setParameter("from", from)
                .setParameter("to", to)
                .getResultList().stream()
                .map(r -> new PartyRow((Long) r[0], (String) r[1], (String) r[2], (Integer) r[3],
                        ((Number) r[4]).longValue(), (LocalDateTime) r[5]))
                .toList();
    }

    private List<FollowRow> followEvents(long hostId, LocalDateTime from, LocalDateTime to) {
        // Load a little before the range so a follow just before it, undone inside it, is recognised.
        List<FollowRow> rows = em.createQuery(
                        "SELECT e.follower.id, e.type, e.occurredAt FROM FollowEvent e "
                                + "WHERE e.followed.id = :hostId AND e.occurredAt >= :from AND e.occurredAt <= :to",
                        Object[].class)
                .setParameter("hostId", hostId)
                .setParameter("from", from.minus(QUICK_UNFOLLOW_WINDOW))
                .setParameter("to", to)
                .getResultList().stream()
                .map(r -> new FollowRow((Long) r[0], (FollowEventType) r[1], (LocalDateTime) r[2]))
                .toList();
        return netChangePerFollower(withoutQuickUnfollows(rows).stream()
                .filter(row -> !row.occurredAt().isBefore(from))
                .toList());
    }

    /**
     * Counts only each follower's net change in the range: someone who was not following at the start
     * and follows at the end is one gained follower, someone who followed at the start and no longer
     * follows at the end is one lost follower; everyone else (came and went, left and came back) counts
     * nothing. Repeated or duplicate entries of the same person therefore never count more than once.
     * The returned row is the follower's last event, which is where the timeline places them.
     */
    static List<FollowRow> netChangePerFollower(List<FollowRow> rows) {
        Map<Long, List<FollowRow>> byFollower = new LinkedHashMap<>();
        rows.stream()
                .sorted(Comparator.comparing(FollowRow::occurredAt))
                .forEach(row -> byFollower.computeIfAbsent(row.followerId(), id -> new ArrayList<>()).add(row));
        List<FollowRow> result = new ArrayList<>();
        for (List<FollowRow> events : byFollower.values()) {
            FollowRow first = events.get(0);
            FollowRow last = events.get(events.size() - 1);
            // The first event tells the state before the range, the last one the state at its end.
            if (first.type() == last.type()) {
                result.add(last);
            }
        }
        result.sort(Comparator.comparing(FollowRow::occurredAt));
        return result;
    }

    /** Drops each follow that the same follower undid within {@link #QUICK_UNFOLLOW_WINDOW}, together with its unfollow. */
    static List<FollowRow> withoutQuickUnfollows(List<FollowRow> rows) {
        List<FollowRow> sorted = rows.stream()
                .sorted(Comparator.comparing(FollowRow::occurredAt))
                .toList();
        Set<FollowRow> dropped = Collections.newSetFromMap(new IdentityHashMap<>());
        Map<Long, FollowRow> openFollow = new HashMap<>();
        for (FollowRow row : sorted) {
            if (row.type() == FollowEventType.FOLLOWED) {
                openFollow.put(row.followerId(), row);
                continue;
            }
            FollowRow follow = openFollow.remove(row.followerId());
            if (follow != null && !row.occurredAt().isAfter(follow.occurredAt().plus(QUICK_UNFOLLOW_WINDOW))) {
                dropped.add(follow);
                dropped.add(row);
            }
        }
        return sorted.stream().filter(row -> !dropped.contains(row)).toList();
    }

    private List<JoinRow> joins(long hostId, LocalDateTime from, LocalDateTime to) {
        List<JoinRow> rows = em.createQuery(
                        "SELECT e.party.id, e.user.id, e.party.visibility, e.occurredAt FROM AttendanceEvent e "
                                + "WHERE e.party.host_user.id = :hostId AND e.type = :type "
                                + "AND e.occurredAt >= :from AND e.occurredAt <= :to",
                        Object[].class)
                .setParameter("hostId", hostId)
                .setParameter("type", AttendanceEventType.JOINED)
                .setParameter("from", from)
                .setParameter("to", to)
                .getResultList().stream()
                .map(r -> new JoinRow((Long) r[0], (Long) r[1], (String) r[2], (LocalDateTime) r[3]))
                .toList();
        return firstJoinPerGuestAndParty(rows);
    }

    /** Each guest counts at most once per party: their first join in the range. */
    static List<JoinRow> firstJoinPerGuestAndParty(List<JoinRow> rows) {
        Map<String, JoinRow> first = new LinkedHashMap<>();
        rows.stream()
                .sorted(Comparator.comparing(JoinRow::occurredAt))
                .forEach(row -> first.putIfAbsent(row.partyId() + ":" + row.userId(), row));
        return List.copyOf(first.values());
    }

    private List<User> distinctGuests(long hostId, LocalDateTime from, LocalDateTime to) {
        return em.createQuery(
                        "SELECT DISTINCT e.user FROM AttendanceEvent e "
                                + "WHERE e.party.host_user.id = :hostId AND e.type = :type AND e.user.id <> :hostId "
                                + "AND e.occurredAt >= :from AND e.occurredAt <= :to",
                        User.class)
                .setParameter("hostId", hostId)
                .setParameter("type", AttendanceEventType.JOINED)
                .setParameter("from", from)
                .setParameter("to", to)
                .getResultList();
    }

    // ---------- metrics ----------

    private VisibilitySplit visibility(List<PartyRow> parties, List<JoinRow> joins) {
        return new VisibilitySplit(
                new VisibilityCount(
                        parties.stream().filter(p -> isPrivate(p.visibility())).count(),
                        joins.stream().filter(j -> isPrivate(j.visibility())).count()),
                new VisibilityCount(
                        parties.stream().filter(p -> !isPrivate(p.visibility())).count(),
                        joins.stream().filter(j -> !isPrivate(j.visibility())).count()));
    }

    private static boolean isPrivate(String visibility) {
        return "PRIVATE".equalsIgnoreCase(visibility);
    }

    private InvitationStats invitations(List<PartyRow> parties) {
        if (parties.isEmpty()) {
            return new InvitationStats(0, 0, 0);
        }
        List<Long> partyIds = parties.stream().map(PartyRow::id).toList();
        Map<String, Long> byStatus = new HashMap<>();
        em.createQuery("SELECT UPPER(i.status), COUNT(i) FROM Invitation i WHERE i.party.id IN :partyIds "
                                + "GROUP BY UPPER(i.status)", Object[].class)
                .setParameter("partyIds", partyIds)
                .getResultList()
                .forEach(r -> byStatus.put((String) r[0], ((Number) r[1]).longValue()));
        return new InvitationStats(
                byStatus.getOrDefault("ACCEPTED", 0L),
                byStatus.getOrDefault("DECLINED", 0L),
                byStatus.getOrDefault("PENDING", 0L));
    }

    private Capacity capacity(List<PartyRow> parties) {
        List<PartyCapacity> rows = parties.stream()
                .filter(p -> p.maxPeople() != null && p.maxPeople() > 0)
                .sorted(Comparator.comparing(PartyRow::createdAt).reversed())
                .map(p -> new PartyCapacity(p.id(), Encode.forHtml(p.title()), p.guests(), p.maxPeople(),
                        round(100.0 * p.guests() / p.maxPeople())))
                .toList();
        Double average = rows.isEmpty() ? null
                : round(rows.stream().mapToDouble(PartyCapacity::percent).average().orElse(0));
        return new Capacity(average, rows);
    }

    private TopParty topParty(List<PartyRow> parties) {
        if (parties.isEmpty()) {
            return null;
        }
        Map<Long, Long> favorites = new HashMap<>();
        em.createQuery("SELECT f.party.id, COUNT(f) FROM Favorite f WHERE f.party.id IN :partyIds GROUP BY f.party.id",
                        Object[].class)
                .setParameter("partyIds", parties.stream().map(PartyRow::id).toList())
                .getResultList()
                .forEach(r -> favorites.put((Long) r[0], ((Number) r[1]).longValue()));

        PartyRow top = parties.stream()
                .max(Comparator.comparingLong(PartyRow::guests)
                        .thenComparingLong(p -> favorites.getOrDefault(p.id(), 0L))
                        .thenComparing(PartyRow::createdAt))
                .orElseThrow();
        return new TopParty(top.id(), Encode.forHtml(top.title()), top.guests(), favorites.getOrDefault(top.id(), 0L));
    }

    Distribution genderDistribution(List<User> guests) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (Gender gender : Gender.values()) {
            counts.put(gender.name(), 0L);
        }
        guests.stream().map(User::getGender).filter(Objects::nonNull)
                .forEach(g -> counts.merge(g.name(), 1L, Long::sum));
        return distribution(counts);
    }

    Distribution ageDistribution(List<User> guests, LocalDate today) {
        Map<String, Long> counts = new LinkedHashMap<>();
        AGE_GROUPS.forEach(group -> counts.put(group, 0L));
        guests.stream().map(User::getBirthDate).filter(Objects::nonNull)
                .forEach(birthDate -> counts.merge(ageGroup(Period.between(birthDate, today).getYears()), 1L, Long::sum));
        return distribution(counts);
    }

    static String ageGroup(int age) {
        if (age < 18) return "<18";
        if (age <= 20) return "18-20";
        if (age <= 24) return "21-24";
        if (age <= 29) return "25-29";
        return "30+";
    }

    private static Distribution distribution(Map<String, Long> counts) {
        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        if (total < MIN_SAMPLE) {
            return new Distribution(true, (int) total, MIN_SAMPLE, Map.of());
        }
        Map<String, Double> percentages = new LinkedHashMap<>();
        counts.forEach((key, count) -> percentages.put(key, round(100.0 * count / total)));
        return new Distribution(false, (int) total, MIN_SAMPLE, percentages);
    }

    Timeline timeline(DashboardRange range, LocalDate firstDay, LocalDate today,
                      List<FollowRow> follows, List<JoinRow> joins) {
        boolean weekly = range.bucket() == DashboardRange.Bucket.WEEK;
        LocalDate first = weekly ? firstDay.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)) : firstDay;
        LocalDate last = weekly ? today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)) : today;
        int step = weekly ? 7 : 1;

        int size = (int) (ChronoUnit.DAYS.between(first, last) / step) + 1;
        long[] gained = new long[size];
        long[] lost = new long[size];
        long[] joined = new long[size];

        for (FollowRow follow : follows) {
            int index = bucketIndex(first, follow.occurredAt().toLocalDate(), step, size);
            if (index < 0) continue;
            if (follow.type() == FollowEventType.FOLLOWED) gained[index]++;
            else lost[index]++;
        }
        for (JoinRow join : joins) {
            int index = bucketIndex(first, join.occurredAt().toLocalDate(), step, size);
            if (index >= 0) joined[index]++;
        }

        List<TimelinePoint> points = new ArrayList<>(size);
        for (int i = 0; i < size; i++) {
            points.add(new TimelinePoint(first.plusDays((long) i * step), gained[i], lost[i], joined[i]));
        }
        return new Timeline(range.bucket(), points);
    }

    private static int bucketIndex(LocalDate first, LocalDate day, int step, int size) {
        long index = ChronoUnit.DAYS.between(first, day) / step;
        return index < 0 || index >= size ? -1 : (int) index;
    }

    private static double round(double value) {
        return BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}
