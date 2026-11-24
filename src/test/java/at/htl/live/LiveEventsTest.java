package at.htl.live;

import at.htl.TestBase;
import at.htl.follow.Follow;
import at.htl.follow.FollowStatus;
import at.htl.location.Location;
import at.htl.party.Party;
import at.htl.user.User;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class LiveEventsTest extends TestBase {
    @Inject EntityManager em;
    @Inject UserChangedRecorder recorder;

    Long anna;
    Long ben;
    Long partyId;
    Long locationId;

    @BeforeEach
    void createData() {
        QuarkusTransaction.requiringNew().run(() -> {
            for (long id = 1; id <= 3; id++) {
                if (em.find(FollowStatus.class, id) == null) {
                    FollowStatus status = new FollowStatus();
                    status.setStatus_id(id);
                    status.setName(id == 1 ? "pending" : id == 2 ? "accepted" : "blocked");
                    em.persist(status);
                }
            }
            User a = user("live-anna");
            User b = user("live-ben");
            anna = a.getId();
            ben = b.getId();
            Location location = new Location();
            location.setAddress("Live test venue");
            location.setLatitude(48.3);
            location.setLongitude(14.2);
            em.persist(location);
            locationId = location.getId();
            Party party = new Party();
            party.setHost_user(a);
            party.setLocation(location);
            party.setTitle("Live test party");
            party.setVisibility("PUBLIC");
            party.setTime_start(LocalDateTime.now().plusDays(1));
            em.persist(party);
            partyId = party.getId();
        });
        recorder.clear();
    }

    @AfterEach
    void cleanup() {
        QuarkusTransaction.requiringNew().run(() -> {
            List<Long> users = List.of(anna, ben);
            em.createQuery("DELETE FROM FollowEvent e WHERE e.follower.id IN :u OR e.followed.id IN :u")
                    .setParameter("u", users).executeUpdate();
            em.createQuery("DELETE FROM Notification n WHERE n.recipient.id IN :u OR n.sender.id IN :u")
                    .setParameter("u", users).executeUpdate();
            em.createQuery("DELETE FROM Follow f WHERE f.user1_id IN :u OR f.user2_id IN :u")
                    .setParameter("u", users).executeUpdate();
            Party party = em.find(Party.class, partyId);
            if (party != null) em.remove(party);
            users.forEach(id -> em.remove(em.find(User.class, id)));
            em.remove(em.find(Location.class, locationId));
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

    @Test
    void followRequestTellsTheTarget() {
        given().header("X-User-Id", ben.toString())
                .when().post("/api/users/{id}/follow?targetUserId={t}", ben, anna)
                .then().statusCode(201);

        assertTrue(recorder.received(anna, UserChanged.NOTIFICATIONS));
    }

    @Test
    void acceptingTellsBothUsersAboutTheFollow() {
        QuarkusTransaction.requiringNew().run(() -> {
            Follow follow = new Follow();
            follow.setUser1_id(ben);
            follow.setUser2_id(anna);
            follow.setStatus(em.find(FollowStatus.class, 1L));
            em.persist(follow);
        });

        given().header("X-User-Id", anna.toString())
                .when().put("/api/users/{id}/followers/{f}", anna, ben)
                .then().statusCode(200);

        assertTrue(recorder.received(anna, UserChanged.FOLLOWS));
        assertTrue(recorder.received(ben, UserChanged.FOLLOWS));
        assertTrue(recorder.received(anna, UserChanged.NOTIFICATIONS), "\"follows you now\" notification");
    }

    @Test
    void joiningTellsTheHost() {
        given().header("X-User-Id", ben.toString())
                .when().post("/api/parties/{id}/join", partyId)
                .then().statusCode(204);

        assertTrue(recorder.received(anna, UserChanged.ATTENDANCE));
    }

    @Test
    void streamRequiresLogin() {
        given().accept("text/event-stream").when().get("/api/live/events").then().statusCode(401);
    }

    @Test
    void streamDeliversChangesOfTheLoggedInUser() throws Exception {
        BlockingQueue<String> lines = new LinkedBlockingQueue<>();
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:8082/api/live/events"))
                .header("X-User-Id", anna.toString()).header("Accept", "text/event-stream").GET().build();
        HttpResponse<Stream<String>> response = client.send(request, HttpResponse.BodyHandlers.ofLines());
        assertEquals(200, response.statusCode());
        Thread reader = Thread.ofVirtual().start(() -> {
            try {
                response.body().forEach(lines::add);
            } catch (RuntimeException closed) {
                // stream closed at the end of the test
            }
        });
        try {
            assertEquals("event:ready", awaitEvent(lines), "stream announces itself");

            given().header("X-User-Id", ben.toString())
                    .when().post("/api/users/{id}/follow?targetUserId={t}", ben, anna)
                    .then().statusCode(201);

            assertEquals("event:changed", awaitEvent(lines), "Ben's follow request reaches Anna live");
            String data = awaitData(lines);
            assertTrue(data.contains("\"kind\":\"notifications\""), data);
        } finally {
            reader.interrupt();
            response.body().close();
            client.close();
        }
    }

    private static String awaitEvent(BlockingQueue<String> lines) throws InterruptedException {
        return await(lines, "event:");
    }

    private static String awaitData(BlockingQueue<String> lines) throws InterruptedException {
        return await(lines, "data:");
    }

    private static String await(BlockingQueue<String> lines, String prefix) throws InterruptedException {
        long deadline = System.nanoTime() + Duration.ofSeconds(5).toNanos();
        while (System.nanoTime() < deadline) {
            String line = lines.poll(100, TimeUnit.MILLISECONDS);
            if (line != null && line.startsWith(prefix)) return line.replace(" ", "");
        }
        return "timeout";
    }
}
