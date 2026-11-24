package at.htl.resource;

import at.htl.TestBase;
import at.htl.follow.Follow;
import at.htl.follow.FollowStatus;
import at.htl.history.FollowEventType;
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
class FollowEndpointsTest extends TestBase {
    @Inject EntityManager em;

    Long anna;
    Long ben;
    Long cleo;

    @BeforeEach
    void createUsers() {
        QuarkusTransaction.requiringNew().run(() -> {
            for (long id = 1; id <= 3; id++) {
                if (em.find(FollowStatus.class, id) == null) {
                    FollowStatus status = new FollowStatus();
                    status.setStatus_id(id);
                    status.setName(id == 1 ? "pending" : id == 2 ? "accepted" : "blocked");
                    em.persist(status);
                }
            }
            anna = user("fe-anna").getId();
            ben = user("fe-ben").getId();
            cleo = user("fe-cleo").getId();
        });
    }

    @AfterEach
    void cleanup() {
        QuarkusTransaction.requiringNew().run(() -> {
            List<Long> users = List.of(anna, ben, cleo);
            em.createQuery("DELETE FROM FollowEvent e WHERE e.follower.id IN :u OR e.followed.id IN :u")
                    .setParameter("u", users).executeUpdate();
            em.createQuery("DELETE FROM Notification n WHERE n.recipient.id IN :u OR n.sender.id IN :u")
                    .setParameter("u", users).executeUpdate();
            em.createQuery("DELETE FROM Follow f WHERE f.user1_id IN :u OR f.user2_id IN :u")
                    .setParameter("u", users).executeUpdate();
            users.forEach(id -> em.remove(em.find(User.class, id)));
        });
    }

    private User user(String name) {
        User user = new User();
        user.setKeycloakId(name);
        user.setDisplayName(name);
        user.setDistinctName(name);
        em.persist(user);
        return user;
    }

    /** from follows to; status 1 = pending, 2 = accepted */
    private void follow(Long from, Long to, long status) {
        QuarkusTransaction.requiringNew().run(() -> {
            Follow follow = new Follow();
            follow.setUser1_id(from);
            follow.setUser2_id(to);
            follow.setStatus(em.find(FollowStatus.class, status));
            follow.setRequestedAt(LocalDateTime.now());
            em.persist(follow);
        });
    }

    private boolean followExists(Long from, Long to) {
        return QuarkusTransaction.requiringNew().call(() -> !em.createQuery(
                        "SELECT f FROM Follow f WHERE f.user1_id = :a AND f.user2_id = :b", Follow.class)
                .setParameter("a", from).setParameter("b", to).getResultList().isEmpty());
    }

    private List<FollowEventType> events(Long follower, Long followed) {
        return QuarkusTransaction.requiringNew().call(() -> em.createQuery(
                        "SELECT e.type FROM FollowEvent e WHERE e.follower.id = :a AND e.followed.id = :b", FollowEventType.class)
                .setParameter("a", follower).setParameter("b", followed).getResultList());
    }

    @Test
    void recipientDeclinesPendingRequest() {
        follow(anna, ben, 1);

        given().header("X-User-Id", ben.toString())
                .when().delete("/api/users/{id}/followers/{followerId}", ben, anna)
                .then().statusCode(204);

        assertFalse(followExists(anna, ben));
        assertTrue(events(anna, ben).isEmpty(), "declining a request is not a lost follower");
    }

    @Test
    void recipientRemovesAcceptedFollowerAndItCountsAsLost() {
        follow(anna, ben, 2);

        given().header("X-User-Id", ben.toString())
                .when().delete("/api/users/{id}/followers/{followerId}", ben, anna)
                .then().statusCode(204);

        assertFalse(followExists(anna, ben));
        assertEquals(List.of(FollowEventType.UNFOLLOWED), events(anna, ben));
    }

    @Test
    void followerUnfollows() {
        follow(anna, ben, 2);

        given().header("X-User-Id", anna.toString())
                .when().delete("/api/users/{id}/followers/{followerId}", ben, anna)
                .then().statusCode(204);

        assertFalse(followExists(anna, ben));
        assertEquals(List.of(FollowEventType.UNFOLLOWED), events(anna, ben));
    }

    @Test
    void thirdPartyCannotRemoveAFollow() {
        follow(anna, ben, 2);

        given().header("X-User-Id", cleo.toString())
                .when().delete("/api/users/{id}/followers/{followerId}", ben, anna)
                .then().statusCode(403);

        assertTrue(followExists(anna, ben));
    }

    @Test
    void followRequestsAreOnlyVisibleToTheirRecipient() {
        follow(anna, ben, 1);

        given().header("X-User-Id", ben.toString())
                .when().get("/api/users/{id}/follow-requests", ben)
                .then().statusCode(200)
                .body("distinctName", contains("fe-anna"));

        given().header("X-User-Id", cleo.toString())
                .when().get("/api/users/{id}/follow-requests", ben)
                .then().statusCode(403);
    }

    @Test
    void followStatusReportsOnlyTheCallersRelationship() {
        follow(anna, ben, 1);
        follow(cleo, ben, 2);

        given().header("X-User-Id", anna.toString())
                .when().get("/api/users/{id}/follow-status", ben)
                .then().statusCode(200).body("status", is("pending"));
        given().header("X-User-Id", cleo.toString())
                .when().get("/api/users/{id}/follow-status", ben)
                .then().statusCode(200).body("status", is("following"));
        given().header("X-User-Id", ben.toString())
                .when().get("/api/users/{id}/follow-status", anna)
                .then().statusCode(200).body("status", is("none"));
    }

    @Test
    void followStatusRequiresLogin() {
        given().when().get("/api/users/{id}/follow-status", ben).then().statusCode(401);
    }
}
