package at.htl.settings;

import at.htl.TestBase;
import at.htl.follow.Follow;
import at.htl.follow.FollowRepository;
import at.htl.follow.FollowStatus;
import at.htl.location.Location;
import at.htl.history.FollowEvent;
import at.htl.notification.Notification;
import at.htl.notificationsettings.UserNotificationSettings;
import at.htl.party.Party;
import at.htl.user.User;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class PrivacyAndBlockingTest extends TestBase {

    @Inject
    EntityManager em;

    @Inject
    FollowRepository followRepository;

    Long a;
    Long b;
    Long c;

    @AfterEach
    void cleanUp() {
        QuarkusTransaction.requiringNew().run(() -> at.htl.TestCleanup.removeUsers(em, java.util.List.of(a, b, c)));
    }

    @BeforeEach
    void setUp() {
        QuarkusTransaction.requiringNew().run(() -> {
            for (long id = 1; id <= 2; id++) {
                if (em.find(FollowStatus.class, id) == null) {
                    FollowStatus status = new FollowStatus();
                    status.setStatus_id(id);
                    status.setName(id == 1 ? "PENDING" : "ACCEPTED");
                    em.persist(status);
                }
            }
        });
        a = user("alice", false);
        b = user("bob", false);
        c = user("carol", false);
    }

    private Long user(String name, boolean isPrivate) {
        return QuarkusTransaction.requiringNew().call(() -> {
            User user = new User();
            user.setDistinctName(name + "_" + System.nanoTime());
            user.setDisplayName(name);
            user.setPrivateAccount(isPrivate);
            em.persist(user);
            return user.getId();
        });
    }

    private void setPrivate(Long id, boolean value) {
        QuarkusTransaction.requiringNew().run(() -> em.find(User.class, id).setPrivateAccount(value));
    }

    private io.restassured.specification.RequestSpecification as(Long id) {
        return given().header("X-User-Id", id.toString());
    }

    private String status(Long follower, Long followed) {
        return QuarkusTransaction.requiringNew().call(() -> followRepository.followStatus(follower, followed));
    }

    private long notificationsFor(Long recipient, String text) {
        return QuarkusTransaction.requiringNew().call(() -> em.createQuery(
                        "SELECT COUNT(n) FROM Notification n WHERE n.recipient.id = :id AND n.message LIKE :text", Long.class)
                .setParameter("id", recipient).setParameter("text", "%" + text + "%").getSingleResult());
    }

    private void follow(Long follower, Long followed) {
        as(follower).when().post("/api/users/{id}/follow?targetUserId={t}", follower, followed).then().statusCode(201);
    }

    // --- private / public -----------------------------------------------------

    @Test
    void newUsersArePublicAndCanBeFollowedDirectly() {
        as(b).when().get("/api/me/privacy").then().statusCode(200).body("isPrivate", is(false));
        follow(a, b);
        assertEquals("following", status(a, b));
        assertEquals(1, notificationsFor(b, "follows you now"));
        long history = QuarkusTransaction.requiringNew().call(() -> em.createQuery(
                "SELECT COUNT(e) FROM FollowEvent e WHERE e.follower.id = :a AND e.followed.id = :b", Long.class)
                .setParameter("a", a).setParameter("b", b).getSingleResult());
        assertEquals(1, history);
    }

    @Test
    void privateAccountsGetRequests() {
        setPrivate(b, true);
        follow(a, b);
        assertEquals("pending", status(a, b));
        assertEquals(0, notificationsFor(b, "follows you now"));
    }

    @Test
    void followingYourselfIsRejected() {
        as(a).when().post("/api/users/{id}/follow?targetUserId={t}", a, a).then().statusCode(400);
    }

    @Test
    void switchingToPrivateKeepsFollowers() {
        follow(a, b);
        as(b).contentType("application/json").body("{\"isPrivate\":true}")
                .when().put("/api/me/privacy").then().statusCode(200).body("isPrivate", is(true));
        assertEquals("following", status(a, b));
        follow(c, b);
        assertEquals("pending", status(c, b));
    }

    @Test
    void goingPublicNeedsConfirmationAndAcceptsOpenRequests() {
        setPrivate(b, true);
        follow(a, b);
        follow(c, b);

        as(b).contentType("application/json").body("{\"isPrivate\":false}")
                .when().put("/api/me/privacy")
                .then().statusCode(409).body("code", is("CONFIRM_ACCEPT_REQUESTS")).body("pendingRequests", is(2));
        assertEquals("pending", status(a, b));

        as(b).contentType("application/json").body("{\"isPrivate\":false,\"acceptPendingRequests\":true}")
                .when().put("/api/me/privacy").then().statusCode(200).body("isPrivate", is(false)).body("pendingRequests", is(0));
        assertEquals("following", status(a, b));
        assertEquals("following", status(c, b));
        assertEquals(1, notificationsFor(a, "accepted your follow request"));
        assertEquals(1, notificationsFor(c, "accepted your follow request"));
    }

    @Test
    void privateProfileShowsOnlyBasicsToNonFollowers() {
        setPrivate(b, true);
        as(a).when().get("/api/users/{id}", b).then().statusCode(200)
                .body("isPrivate", is(true)).body("displayName", is("bob")).body("email", nullValue());
        as(a).when().get("/api/users/{id}/followers", b).then().statusCode(403);
        as(a).when().get("/api/users/{id}/following", b).then().statusCode(403);
        as(a).when().get("/api/users/{id}/parties", b).then().statusCode(403);
        as(a).when().get("/api/users/{id}/media", b).then().statusCode(403);
        as(a).when().get("/api/users/{id}/followers/count", b).then().statusCode(200);

        follow(a, b);
        as(b).when().put("/api/users/{id}/followers/{f}", b, a).then().statusCode(200);
        as(a).when().get("/api/users/{id}/followers", b).then().statusCode(200);
        as(a).when().get("/api/users/{id}/parties", b).then().statusCode(200);
        as(b).when().get("/api/users/{id}/parties", b).then().statusCode(200);
    }

    @Test
    void privacyOfAnotherUserCannotBeChanged() {
        // There is no address for another user's privacy; the switch always targets the caller.
        as(a).contentType("application/json").body("{\"isPrivate\":true}").when().put("/api/me/privacy").then().statusCode(200);
        as(b).when().get("/api/me/privacy").then().body("isPrivate", is(false));
        given().contentType("application/json").body("{\"isPrivate\":true}").when().put("/api/me/privacy").then().statusCode(401);
    }

    // --- blocking ---------------------------------------------------------------

    @Test
    void blockingRemovesFollowsBothWaysSilently() {
        follow(a, b);
        follow(b, a);
        as(a).when().put("/api/me/blocks/{id}", b).then().statusCode(204);

        assertEquals("none", status(a, b));
        assertEquals("none", status(b, a));
        assertEquals(0, notificationsFor(a, "unfollowed you"));
        assertEquals(0, notificationsFor(b, "unfollowed you"));
        assertEquals(0, notificationsFor(b, "block"));
    }

    @Test
    void blockedUsersCannotSeeOrFollowEachOther() {
        as(a).when().put("/api/me/blocks/{id}", b).then().statusCode(204);

        as(a).when().get("/api/users/{id}", b).then().statusCode(404);
        as(b).when().get("/api/users/{id}", a).then().statusCode(404);
        as(b).when().get("/api/users/{id}/followers", a).then().statusCode(404);
        as(b).when().post("/api/users/{id}/follow?targetUserId={t}", b, a).then().statusCode(404);
        as(a).when().post("/api/users/{id}/follow?targetUserId={t}", a, b).then().statusCode(404);
        assertEquals("none", status(b, a));

        String handleA = as(a).when().get("/api/users/{id}", a).then().extract().path("distinctName");
        List<Integer> found = as(b).when().get("/api/users?q=" + handleA).then().statusCode(200).extract().path("id");
        assertFalse(found.contains(a.intValue()));
        List<Integer> foundByC = as(c).when().get("/api/users?q=" + handleA).then().statusCode(200).extract().path("id");
        assertTrue(foundByC.contains(a.intValue()));
    }

    @Test
    void blockedUsersDisappearFromFollowLists() {
        follow(c, a);
        follow(b, a);
        as(c).when().put("/api/me/blocks/{id}", b).then().statusCode(204);
        List<Integer> followersSeenByC = as(c).when().get("/api/users/{id}/followers", a).then().statusCode(200).extract().path("id");
        assertTrue(followersSeenByC.contains(c.intValue()));
        assertFalse(followersSeenByC.contains(b.intValue()));
    }

    @Test
    void partiesOfBlockedHostsAreNotDiscovered() {
        Long partyId = QuarkusTransaction.requiringNew().call(() -> {
            Location location = new Location();
            location.setAddress("Block Street 1");
            location.setLatitude(48.3);
            location.setLongitude(14.3);
            em.persist(location);
            Party party = new Party();
            party.setLocation(location);
            party.setTitle("Blocked host party");
            party.setVisibility("PUBLIC");
            party.setHost_user(em.find(User.class, a));
            party.setTime_start(LocalDateTime.now().plusDays(2));
            party.setTime_end(LocalDateTime.now().plusDays(2).plusHours(4));
            em.persist(party);
            return party.getId();
        });
        List<Integer> beforeBlock = as(b).when().get("/api/parties?limit=500").then().statusCode(200).extract().path("id");
        assertTrue(beforeBlock.contains(partyId.intValue()));

        as(b).when().put("/api/me/blocks/{id}", a).then().statusCode(204);
        List<Integer> afterBlock = as(b).when().get("/api/parties?limit=500").then().statusCode(200).extract().path("id");
        assertFalse(afterBlock.contains(partyId.intValue()));
        List<Integer> forHost = as(a).when().get("/api/parties?limit=500").then().statusCode(200).extract().path("id");
        assertTrue(forHost.contains(partyId.intValue()));
    }

    @Test
    void blockListIsOwnAndUnblockDoesNotRestoreFollows() {
        follow(a, b);
        as(a).when().get("/api/me/blocks").then().statusCode(200).body("size()", is(0));
        as(a).when().put("/api/me/blocks/{id}", b).then().statusCode(204);
        as(a).when().put("/api/me/blocks/{id}", b).then().statusCode(204);
        as(a).when().get("/api/me/blocks").then().statusCode(200).body("size()", is(1)).body("[0].id", is(b.intValue()));
        as(b).when().get("/api/me/blocks").then().statusCode(200).body("size()", is(0));

        as(a).when().delete("/api/me/blocks/{id}", b).then().statusCode(204);
        as(a).when().get("/api/users/{id}", b).then().statusCode(200);
        assertEquals("none", status(a, b));
    }

    @Test
    void selfBlockIsRejected() {
        as(a).when().put("/api/me/blocks/{id}", a).then().statusCode(400);
        given().when().get("/api/me/blocks").then().statusCode(401);
    }

    // --- unfollow notification ---------------------------------------------------------

    @Test
    void unfollowTellsTheFollowedUserOnlyWhenTheFollowerLeaves() {
        follow(a, b);
        as(a).when().delete("/api/users/{id}/followers/{f}", b, a).then().statusCode(204);
        assertEquals(1, notificationsFor(b, "unfollowed you"));

        follow(c, b);
        as(b).when().delete("/api/users/{id}/followers/{f}", b, c).then().statusCode(204);
        assertEquals(0, notificationsFor(b, "unfollowed you") - 1);
        assertEquals(0, notificationsFor(c, "unfollowed you"));
    }

    @Test
    void unfollowNotificationRespectsTheSwitch() {
        QuarkusTransaction.requiringNew().run(() -> {
            UserNotificationSettings settings = new UserNotificationSettings(em.find(User.class, b));
            settings.setUnfollows(false);
            em.persist(settings);
        });
        follow(a, b);
        as(a).when().delete("/api/users/{id}/followers/{f}", b, a).then().statusCode(204);
        assertEquals(0, notificationsFor(b, "unfollowed you"));
    }
}
