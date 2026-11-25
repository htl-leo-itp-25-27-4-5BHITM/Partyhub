package at.htl.live;

import at.htl.TestBase;
import at.htl.invitation.Invitation;
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
class PartyLiveEventsTest extends TestBase {
    @Inject EntityManager em;
    @Inject PartyChangedRecorder recorder;

    Long host;
    Long guest;
    Long stranger;
    Long publicPartyId;
    Long privatePartyId;
    Long locationId;

    @BeforeEach
    void createData() {
        QuarkusTransaction.requiringNew().run(() -> {
            User h = user("pl-host");
            host = h.getId();
            guest = user("pl-guest").getId();
            stranger = user("pl-stranger").getId();
            Location location = new Location();
            location.setAddress("Party live venue");
            location.setLatitude(48.3);
            location.setLongitude(14.2);
            em.persist(location);
            locationId = location.getId();
            publicPartyId = party(h, location, "PUBLIC").getId();
            privatePartyId = party(h, location, "PRIVATE").getId();
        });
        recorder.clear();
    }

    @AfterEach
    void cleanup() {
        QuarkusTransaction.requiringNew().run(() -> {
            List<Long> users = List.of(host, guest, stranger);
            List<Long> parties = List.of(publicPartyId, privatePartyId);
            em.createQuery("DELETE FROM Notification n WHERE n.recipient.id IN :u OR n.sender.id IN :u")
                    .setParameter("u", users).executeUpdate();
            em.createQuery("DELETE FROM Invitation i WHERE i.party.id IN :p").setParameter("p", parties).executeUpdate();
            em.createQuery("DELETE FROM AttendanceEvent e WHERE e.party.id IN :p").setParameter("p", parties).executeUpdate();
            parties.forEach(id -> em.remove(em.find(Party.class, id)));
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

    private Party party(User host, Location location, String visibility) {
        Party party = new Party();
        party.setHost_user(host);
        party.setLocation(location);
        party.setTitle("Party live " + visibility);
        party.setVisibility(visibility);
        party.setTime_start(LocalDateTime.now().plusDays(1));
        em.persist(party);
        return party;
    }

    @Test
    void joiningChangesTheGuestList() {
        given().header("X-User-Id", guest.toString())
                .when().post("/api/parties/{id}/join", publicPartyId)
                .then().statusCode(204);

        assertTrue(recorder.received(publicPartyId));
    }

    @Test
    void anyStoredInvitationChangeChangesTheGuestList() {
        Long invitationId = QuarkusTransaction.requiringNew().call(() -> {
            Invitation invitation = new Invitation();
            invitation.setParty(em.find(Party.class, privatePartyId));
            invitation.setSender(em.find(User.class, host));
            invitation.setRecipient(em.find(User.class, guest));
            invitation.setStatus("PENDING");
            em.persist(invitation);
            return invitation.getId();
        });
        assertTrue(recorder.received(privatePartyId), "new invitation");

        recorder.clear();
        given().header("X-User-Id", guest.toString())
                .when().post("/api/invitations/{id}/decline", invitationId)
                .then().statusCode(200);
        assertTrue(recorder.received(privatePartyId), "declined invitation");
    }

    @Test
    void streamRequiresLoginAndVisibility() {
        given().accept("text/event-stream").when().get("/api/live/parties/{id}/events", publicPartyId)
                .then().statusCode(401);
        given().header("X-User-Id", stranger.toString()).accept("text/event-stream")
                .when().get("/api/live/parties/{id}/events", privatePartyId)
                .then().statusCode(404);
    }

    @Test
    void streamDeliversGuestListChanges() throws Exception {
        BlockingQueue<String> lines = new LinkedBlockingQueue<>();
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder(
                        URI.create("http://localhost:8082/api/live/parties/" + publicPartyId + "/events"))
                .header("X-User-Id", stranger.toString()).header("Accept", "text/event-stream").GET().build();
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
            assertEquals("event:ready", awaitEvent(lines));

            given().header("X-User-Id", guest.toString())
                    .when().post("/api/parties/{id}/join", publicPartyId)
                    .then().statusCode(204);

            assertEquals("event:changed", awaitEvent(lines), "another user's join reaches the open detail page");
        } finally {
            reader.interrupt();
            response.body().close();
            client.close();
        }
    }

    private static String awaitEvent(BlockingQueue<String> lines) throws InterruptedException {
        long deadline = System.nanoTime() + Duration.ofSeconds(5).toNanos();
        while (System.nanoTime() < deadline) {
            String line = lines.poll(100, TimeUnit.MILLISECONDS);
            if (line != null && line.startsWith("event:")) return line.replace(" ", "");
        }
        return "timeout";
    }
}
