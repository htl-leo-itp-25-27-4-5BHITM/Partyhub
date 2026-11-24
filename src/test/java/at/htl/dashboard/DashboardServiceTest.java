package at.htl.dashboard;

import at.htl.TestBase;
import at.htl.favorite.FavoriteTestData;
import at.htl.history.AttendanceEvent;
import at.htl.history.AttendanceEventType;
import at.htl.history.FollowEvent;
import at.htl.history.FollowEventType;
import at.htl.invitation.Invitation;
import at.htl.location.Location;
import at.htl.party.Party;
import at.htl.user.Gender;
import at.htl.user.User;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

/** Service and resource tests for the host dashboard on one shared data set. */
@QuarkusTest
class DashboardServiceTest extends TestBase {

    @Inject EntityManager em;
    @Inject DashboardService service;

    final List<Long> userIds = new ArrayList<>();
    final List<Long> partyIds = new ArrayList<>();
    Long locationId;
    Long hostId;
    Long otherHostId;
    Long loneUserId;
    Long partyAId;
    Long partyBId;
    LocalDateTime now;

    @BeforeEach
    void createData() {
        now = LocalDateTime.now();
        QuarkusTransaction.requiringNew().run(() -> {
            Location location = new Location();
            location.setAddress("Dashboard test venue");
            location.setLatitude(48.3);
            location.setLongitude(14.2);
            em.persist(location);
            locationId = location.getId();

            User host = user("dash-host", null, null);
            User otherHost = user("dash-other-host", null, null);
            User lone = user("dash-lone", null, null);
            User g1 = user("dash-g1", Gender.MALE, LocalDate.now().minusYears(19));
            User g2 = user("dash-g2", Gender.MALE, LocalDate.now().minusYears(22));
            User g3 = user("dash-g3", Gender.FEMALE, LocalDate.now().minusYears(31));
            User g4 = user("dash-g4", Gender.FEMALE, null);
            User g5 = user("dash-g5", Gender.DIVERSE, null);
            User g6 = user("dash-g6", Gender.FEMALE, null);
            hostId = host.getId();
            otherHostId = otherHost.getId();
            loneUserId = lone.getId();

            Party a = party(host, "Rooftop <Night>", "PUBLIC", 10, g1, g2, g3);
            Party b = party(host, "Secret Dinner", "PRIVATE", 4, g4);
            Party c = party(otherHost, "Not mine", "PUBLIC", 50, g1);
            partyAId = a.getId();
            partyBId = b.getId();

            joined(a, g1, 1);
            joined(a, g2, 2);
            joined(a, g3, 3);
            joined(b, g4, 1);
            joined(a, g5, 2);
            em.persist(new AttendanceEvent(a, g5, AttendanceEventType.LEFT, now.minusDays(1)));
            joined(b, g6, 40);
            joined(c, g1, 1);

            follow(g1, host, FollowEventType.FOLLOWED, 1);
            follow(g2, host, FollowEventType.FOLLOWED, 5);
            follow(g2, host, FollowEventType.UNFOLLOWED, 2);
            follow(g3, host, FollowEventType.FOLLOWED, 50);
            follow(g1, otherHost, FollowEventType.FOLLOWED, 1);

            invitation(b, host, g4, "PENDING");
            invitation(a, host, g1, "ACCEPTED");

            FavoriteTestData.create(em, g6, b);
        });
    }

    @AfterEach
    void cleanup() {
        QuarkusTransaction.requiringNew().run(() -> {
            em.createQuery("DELETE FROM Favorite f WHERE f.party.id IN :partyIds")
                    .setParameter("partyIds", partyIds).executeUpdate();
            em.createQuery("DELETE FROM Invitation i WHERE i.party.id IN :partyIds")
                    .setParameter("partyIds", partyIds).executeUpdate();
            em.createQuery("DELETE FROM AttendanceEvent e WHERE e.party.id IN :partyIds")
                    .setParameter("partyIds", partyIds).executeUpdate();
            em.createQuery("DELETE FROM FollowEvent e WHERE e.followed.id IN :users OR e.follower.id IN :users")
                    .setParameter("users", userIds).executeUpdate();
            em.createQuery("DELETE FROM Notification n WHERE n.recipient.id IN :users OR n.sender.id IN :users")
                    .setParameter("users", userIds).executeUpdate();
            for (Long id : partyIds) {
                em.remove(em.find(Party.class, id));
            }
            for (Long id : userIds) {
                em.remove(em.find(User.class, id));
            }
            em.remove(em.find(Location.class, locationId));
        });
        userIds.clear();
        partyIds.clear();
    }

    private User user(String name, Gender gender, LocalDate birthDate) {
        User user = new User();
        user.setKeycloakId(name);
        user.setDisplayName(name);
        user.setDistinctName(name);
        user.setGender(gender);
        user.setBirthDate(birthDate);
        em.persist(user);
        userIds.add(user.getId());
        return user;
    }

    private Party party(User host, String title, String visibility, int maxPeople, User... guests) {
        Party party = new Party();
        party.setHost_user(host);
        party.setLocation(em.find(Location.class, locationId));
        party.setTitle(title);
        party.setVisibility(visibility);
        party.setMax_people(maxPeople);
        party.setTime_start(now.plusDays(3));
        for (User guest : guests) {
            party.getUsers().add(guest);
        }
        em.persist(party);
        partyIds.add(party.getId());
        return party;
    }

    private void joined(Party party, User user, int daysAgo) {
        em.persist(new AttendanceEvent(party, user, AttendanceEventType.JOINED, now.minusDays(daysAgo)));
    }

    private void follow(User follower, User followed, FollowEventType type, int daysAgo) {
        em.persist(new FollowEvent(follower, followed, type, now.minusDays(daysAgo)));
    }

    private void invitation(Party party, User sender, User recipient, String status) {
        Invitation invitation = new Invitation();
        invitation.setParty(party);
        invitation.setSender(sender);
        invitation.setRecipient(recipient);
        invitation.setStatus(status);
        em.persist(invitation);
    }

    private DashboardDto build(long userId, DashboardRange range, LocalDateTime at) {
        return QuarkusTransaction.requiringNew().call(() -> service.build(userId, range, at));
    }

    // ---------- service ----------

    @Test
    void countsActivityOfTheHostInThe30DayRange() {
        DashboardDto dto = build(hostId, DashboardRange.DAYS_30, LocalDateTime.now());

        assertEquals("30d", dto.range());
        assertEquals(2, dto.partiesCreated());
        assertEquals(2, dto.followersGained());
        assertEquals(1, dto.followersLost());
        assertEquals(5, dto.joins(), "joins of other hosts and joins older than 30 days are not counted");

        assertEquals(1, dto.visibility().privateParties().parties());
        assertEquals(1, dto.visibility().privateParties().joins());
        assertEquals(1, dto.visibility().publicParties().parties());
        assertEquals(4, dto.visibility().publicParties().joins());

        assertEquals(1, dto.invitations().accepted());
        assertEquals(0, dto.invitations().declined());
        assertEquals(1, dto.invitations().pending());
    }

    @Test
    void reportsCapacityPerPartyAndOnAverage() {
        DashboardDto dto = build(hostId, DashboardRange.DAYS_30, LocalDateTime.now());

        assertEquals(27.5, dto.capacity().averagePercent());
        assertEquals(2, dto.capacity().parties().size());
        DashboardDto.PartyCapacity a = dto.capacity().parties().stream()
                .filter(p -> p.partyId() == partyAId).findFirst().orElseThrow();
        assertEquals(3, a.guests());
        assertEquals(30.0, a.percent());
    }

    @Test
    void topPartyHasMostGuestsAndEncodedTitle() {
        DashboardDto.TopParty top = build(hostId, DashboardRange.DAYS_30, LocalDateTime.now()).topParty();

        assertEquals(partyAId, top.partyId());
        assertEquals(3, top.guests());
        assertEquals("Rooftop &lt;Night&gt;", top.title());
    }

    @Test
    void topPartyTieIsBrokenByFavorites() {
        QuarkusTransaction.requiringNew().run(() -> {
            Party a = em.find(Party.class, partyAId);
            a.getUsers().removeIf(u -> !u.getDisplayName().equals("dash-g1"));
            Party b = em.find(Party.class, partyBId);
            assertEquals(1, b.getUsers().size());
        });

        DashboardDto.TopParty top = build(hostId, DashboardRange.DAYS_30, LocalDateTime.now()).topParty();

        assertEquals(partyBId, top.partyId(), "both have one guest, B has one favorite");
        assertEquals(1, top.favorites());
    }

    @Test
    void genderDistributionUsesDistinctGuestsOfTheRange() {
        DashboardDto.Distribution gender = build(hostId, DashboardRange.DAYS_30, LocalDateTime.now()).gender();

        assertFalse(gender.withheld());
        assertEquals(5, gender.sampleSize());
        assertEquals(40.0, gender.percentages().get("MALE"));
        assertEquals(40.0, gender.percentages().get("FEMALE"));
        assertEquals(20.0, gender.percentages().get("DIVERSE"));
        assertEquals(0.0, gender.percentages().get("NOT_SPECIFIED"));
    }

    @Test
    void ageDistributionIsWithheldBelowFiveGuests() {
        DashboardDto.Distribution age = build(hostId, DashboardRange.DAYS_30, LocalDateTime.now()).age();

        assertTrue(age.withheld());
        assertEquals(3, age.sampleSize());
        assertTrue(age.percentages().isEmpty());
    }

    @Test
    void genderPercentagesMatchSpecExample() {
        List<User> guests = new ArrayList<>();
        for (Gender g : List.of(Gender.MALE, Gender.MALE, Gender.MALE, Gender.MALE,
                Gender.FEMALE, Gender.FEMALE, Gender.FEMALE, Gender.DIVERSE)) {
            User u = new User();
            u.setGender(g);
            guests.add(u);
        }
        User withoutGender = new User();
        guests.add(withoutGender);

        DashboardDto.Distribution d = service.genderDistribution(guests);

        assertEquals(8, d.sampleSize());
        assertEquals(50.0, d.percentages().get("MALE"));
        assertEquals(37.5, d.percentages().get("FEMALE"));
        assertEquals(12.5, d.percentages().get("DIVERSE"));
    }

    @Test
    void ageGroupsHaveTheDocumentedBoundaries() {
        assertEquals("<18", DashboardService.ageGroup(17));
        assertEquals("18-20", DashboardService.ageGroup(18));
        assertEquals("18-20", DashboardService.ageGroup(20));
        assertEquals("21-24", DashboardService.ageGroup(21));
        assertEquals("25-29", DashboardService.ageGroup(29));
        assertEquals("30+", DashboardService.ageGroup(30));
    }

    @Test
    void sameFollowerRecordedManyTimesCountsAsOneNewFollower() {
        QuarkusTransaction.requiringNew().run(() -> {
            User g4 = em.createQuery("SELECT u FROM User u WHERE u.keycloakId = 'dash-g4'", User.class).getSingleResult();
            User host = em.find(User.class, hostId);
            for (int i = 0; i < 22; i++) {
                em.persist(new FollowEvent(g4, host, FollowEventType.FOLLOWED, now.minusDays(20).plusHours(i)));
            }
        });

        DashboardDto dto = build(hostId, DashboardRange.DAYS_30, LocalDateTime.now());

        assertEquals(3, dto.followersGained(), "g1, g2 and g4 once each");
        long timelineGained = dto.timeline().points().stream().mapToLong(DashboardDto.TimelinePoint::followersGained).sum();
        assertEquals(dto.followersGained(), timelineGained, "timeline and tiles must agree");
    }

    @Test
    void guestJoiningTheSamePartyAgainCountsOnce() {
        QuarkusTransaction.requiringNew().run(() -> {
            User g5 = em.createQuery("SELECT u FROM User u WHERE u.keycloakId = 'dash-g5'", User.class).getSingleResult();
            em.persist(new AttendanceEvent(em.find(Party.class, partyAId), g5, AttendanceEventType.JOINED, now.minusHours(5)));
        });

        DashboardDto dto = build(hostId, DashboardRange.DAYS_30, LocalDateTime.now());

        assertEquals(5, dto.joins(), "g5 rejoined party A but still counts once");
        assertEquals(4, dto.visibility().publicParties().joins());
    }

    @Test
    void quickFollowAndUnfollowIsNotCounted() {
        QuarkusTransaction.requiringNew().run(() -> {
            User g4 = em.createQuery("SELECT u FROM User u WHERE u.keycloakId = 'dash-g4'", User.class).getSingleResult();
            User host = em.find(User.class, hostId);
            em.persist(new FollowEvent(g4, host, FollowEventType.FOLLOWED, now.minusHours(30)));
            em.persist(new FollowEvent(g4, host, FollowEventType.UNFOLLOWED, now.minusHours(29)));
        });

        DashboardDto dto = build(hostId, DashboardRange.DAYS_30, LocalDateTime.now());

        assertEquals(2, dto.followersGained(), "the quick follow of g4 must not count");
        assertEquals(1, dto.followersLost(), "the quick unfollow of g4 must not count");
    }

    @Test
    void quickUnfollowRightAfterARangeStartsIsNotCountedAsLoss() {
        LocalDateTime at = LocalDateTime.now();
        LocalDateTime rangeStart = DashboardRange.DAYS_7.start(at);
        QuarkusTransaction.requiringNew().run(() -> {
            User g4 = em.createQuery("SELECT u FROM User u WHERE u.keycloakId = 'dash-g4'", User.class).getSingleResult();
            User host = em.find(User.class, hostId);
            em.persist(new FollowEvent(g4, host, FollowEventType.FOLLOWED, rangeStart.minusHours(2)));
            em.persist(new FollowEvent(g4, host, FollowEventType.UNFOLLOWED, rangeStart.plusHours(2)));
        });

        DashboardDto dto = build(hostId, DashboardRange.DAYS_7, at);

        assertEquals(1, dto.followersLost(), "only g2's unfollow counts, not g4's quick one");
    }

    @Test
    void sevenDayTimelineHasOnePointPerDayIncludingQuietDays() {
        DashboardDto dto = build(hostId, DashboardRange.DAYS_7, LocalDateTime.now());
        List<DashboardDto.TimelinePoint> points = dto.timeline().points();

        assertEquals(DashboardRange.Bucket.DAY, dto.timeline().bucket());
        assertEquals(7, points.size());
        assertEquals(now.toLocalDate(), points.get(6).start());
        assertEquals(now.toLocalDate().minusDays(1), points.get(5).start());
        assertEquals(1, points.get(5).followersGained());
        assertEquals(2, points.get(5).joins());
        assertEquals(1, points.get(4).followersLost());
        assertEquals(0, points.get(0).joins() + points.get(0).followersGained() + points.get(0).followersLost());
        long joinSum = points.stream().mapToLong(DashboardDto.TimelinePoint::joins).sum();
        assertEquals(dto.joins(), joinSum);
    }

    @Test
    void sixMonthTimelineUsesWeeksStartingOnMonday() {
        DashboardDto dto = build(hostId, DashboardRange.MONTHS_6, LocalDateTime.now());

        assertEquals(DashboardRange.Bucket.WEEK, dto.timeline().bucket());
        assertTrue(dto.timeline().points().size() >= 26);
        dto.timeline().points().forEach(p -> assertEquals(DayOfWeek.MONDAY, p.start().getDayOfWeek()));
        assertEquals(6, dto.joins());
        assertEquals(3, dto.followersGained());
    }

    @Test
    void emptyRangeReturnsZerosInsteadOfErrors() {
        DashboardDto dto = build(loneUserId, DashboardRange.DAYS_30, LocalDateTime.now());

        assertEquals(0, dto.partiesCreated());
        assertEquals(0, dto.joins());
        assertEquals(0, dto.followersGained());
        assertNull(dto.topParty());
        assertNull(dto.capacity().averagePercent());
        assertTrue(dto.gender().withheld());
        assertEquals(30, dto.timeline().points().size());
    }

    @Test
    void partiesCreatedBeforeTheRangeAreNotCounted() {
        DashboardDto dto = build(hostId, DashboardRange.DAYS_7, now.plusDays(30));

        assertEquals(0, dto.partiesCreated());
        assertNull(dto.topParty());
    }

    // ---------- resource ----------

    @Test
    void endpointRequiresAuthentication() {
        given().when().get("/api/dashboard").then().statusCode(401);
    }

    @Test
    void endpointRejectsUnknownRange() {
        given().header("X-User-Id", hostId.toString())
                .when().get("/api/dashboard?range=1y")
                .then().statusCode(400)
                .body("error", containsString("7d"));
    }

    @Test
    void endpointReturnsOnlyTheCallersStatistics() {
        given().header("X-User-Id", hostId.toString())
                .when().get("/api/dashboard?range=7d&userId=" + otherHostId)
                .then().statusCode(200)
                .header("Cache-Control", containsString("no-store"))
                .body("range", is("7d"))
                .body("partiesCreated", is(2))
                .body("followersGained", is(2))
                .body("followersLost", is(1))
                .body("timeline.points", hasSize(7));

        given().header("X-User-Id", otherHostId.toString())
                .when().get("/api/dashboard")
                .then().statusCode(200)
                .body("range", is("30d"))
                .body("partiesCreated", is(1))
                .body("joins", is(1))
                .body("followersGained", is(1));
    }
}
