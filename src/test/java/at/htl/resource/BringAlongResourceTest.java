package at.htl.resource;

import at.htl.TestBase;
import at.htl.bringalong.BringAlongChangedRecorder;
import at.htl.location.Location;
import at.htl.party.Party;
import at.htl.user.User;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
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
import static org.hamcrest.Matchers.*;

@QuarkusTest
class BringAlongResourceTest extends TestBase {
    @Inject EntityManager em;
    @Inject BringAlongChangedRecorder recorder;

    Long partyId;
    Long hostId;
    Long anna;
    Long ben;
    Long cleo;
    Long outsider;
    Long locationId;

    @BeforeEach
    void createData() {
        QuarkusTransaction.requiringNew().run(() -> {
            User host = user("bring-host");
            User a = user("bring-anna");
            User b = user("bring-ben");
            User c = user("bring-cleo");
            User d = user("bring-outsider");
            hostId = host.getId();
            anna = a.getId();
            ben = b.getId();
            cleo = c.getId();
            outsider = d.getId();
            Location location = new Location();
            location.setAddress("Bring-along test venue");
            location.setLatitude(48.3);
            location.setLongitude(14.2);
            em.persist(location);
            locationId = location.getId();
            Party party = new Party();
            party.setHost_user(host);
            party.setLocation(location);
            party.setTitle("Bring-along test party");
            party.setVisibility("PUBLIC");
            party.setTime_start(LocalDateTime.now().plusDays(1));
            party.getUsers().add(a);
            party.getUsers().add(b);
            party.getUsers().add(c);
            em.persist(party);
            partyId = party.getId();
        });
        recorder.clear();
    }

    private User user(String name) {
        User user = new User();
        user.setKeycloakId(name);
        user.setDistinctName(name);
        user.setDisplayName(name);
        user.setEmail(name + "@example.com");
        em.persist(user);
        return user;
    }

    @AfterEach
    void cleanup() {
        QuarkusTransaction.requiringNew().run(() -> {
            List<Long> users = List.of(anna, ben, cleo, outsider, hostId);
            em.createQuery("delete from Notification n where n.party.id = :partyId or n.recipient.id in :users or n.sender.id in :users")
                    .setParameter("partyId", partyId).setParameter("users", users).executeUpdate();
            Party party = em.find(Party.class, partyId);
            if (party != null) em.remove(party);
            for (Long id : users) em.remove(em.find(User.class, id));
            em.remove(em.find(Location.class, locationId));
        });
    }

    private RequestSpecification as(Long userId) {
        return given().header("X-User-Id", userId.toString()).contentType(ContentType.JSON);
    }

    private String base() { return "/api/parties/" + partyId + "/bring-along"; }

    private int createItem(String name, int quantity) {
        return as(hostId).body("{\"name\":\"" + name + "\",\"quantity\":" + quantity + ",\"unit\":\"Packung\"}")
                .post(base() + "/items").then().statusCode(201).extract().path("id");
    }

    private String pledge(int itemId) { return base() + "/items/" + itemId + "/pledge"; }

    @Test
    void hostAndAttendeesCanReadNonMembersCannot() {
        createItem("Chips", 3);
        as(hostId).get(base()).then().statusCode(200).body("size()", is(1)).body("[0].name", is("Chips"));
        as(anna).get(base()).then().statusCode(200).body("[0].quantity", is(3)).body("[0].fulfilled", is(false));
        as(outsider).get(base()).then().statusCode(403);
        given().get(base()).then().statusCode(401);

        QuarkusTransaction.requiringNew().run(() -> em.find(Party.class, partyId).setVisibility("PRIVATE"));
        as(outsider).get(base()).then().statusCode(404);
        as(anna).get("/api/parties/9223372036854775807/bring-along").then().statusCode(404);
    }

    @Test
    void itemsAreReturnedInCreationOrder() {
        createItem("Chips", 3);
        createItem("Cola", 2);
        as(anna).get(base()).then().statusCode(200).body("name", contains("Chips", "Cola"));
    }

    @Test
    void onlyTheHostManagesItems() {
        int id = createItem("Chips", 3);
        as(anna).body("{\"name\":\"Cola\",\"quantity\":1}").post(base() + "/items").then().statusCode(403);
        as(anna).body("{\"name\":\"Cola\",\"quantity\":1}").put(base() + "/items/" + id).then().statusCode(403);
        as(anna).delete(base() + "/items/" + id).then().statusCode(403);

        as(hostId).body("{\"name\":\"Nachos\",\"quantity\":4,\"unit\":\"Stk.\"}").put(base() + "/items/" + id)
                .then().statusCode(200).body("name", is("Nachos")).body("unit", is("Stk.")).body("remaining", is(4));
    }

    @Test
    void invalidItemsAreRejected() {
        as(hostId).body("{\"name\":\" \",\"quantity\":1}").post(base() + "/items").then().statusCode(400);
        as(hostId).body("{\"name\":\"<b>x</b>\",\"quantity\":1}").post(base() + "/items").then().statusCode(400);
        as(hostId).body("{\"name\":\"Chips\",\"quantity\":0}").post(base() + "/items").then().statusCode(400);
        as(hostId).body("{\"name\":\"Chips\",\"quantity\":10001}").post(base() + "/items").then().statusCode(400);
        as(hostId).body("{\"name\":\"Chips\",\"quantity\":1.5}").post(base() + "/items").then().statusCode(400);
        as(hostId).get(base()).then().body("size()", is(0));
        Assertions.assertEquals(0, recorder.count(partyId));
    }

    @Test
    void itemOfAnotherPartyIsNotFound() {
        int id = createItem("Chips", 3);
        String foreign = "/api/parties/9223372036854775807/bring-along/items/" + id;
        as(hostId).delete(foreign).then().statusCode(404);
        as(hostId).delete(base() + "/items/9223372036854775807").then().statusCode(404);
        as(anna).body("{\"quantity\":1}").put(base() + "/items/9223372036854775807/pledge").then().statusCode(404);
    }

    @Test
    void pledgesAddUpUntilTheItemIsCovered() {
        int id = createItem("Chips", 3);
        as(anna).body("{\"quantity\":1}").put(pledge(id)).then().statusCode(200)
                .body("pledged", is(1)).body("remaining", is(2)).body("fulfilled", is(false))
                .body("pledges[0].displayName", is("bring-anna")).body("pledges[0].quantity", is(1));
        as(ben).body("{\"quantity\":2}").put(pledge(id)).then().statusCode(200)
                .body("remaining", is(0)).body("fulfilled", is(true)).body("pledges.size()", is(2));

        // A fourth pack is not accepted.
        as(cleo).body("{\"quantity\":1}").put(pledge(id)).then().statusCode(409)
                .body("remaining", is(0)).body("item.fulfilled", is(true));
        as(cleo).get(base()).then().body("[0].pledged", is(3)).body("[0].pledges.size()", is(2));
    }

    @Test
    void changingOwnPledgeFreesOrUsesQuantity() {
        int id = createItem("Chips", 4);
        as(anna).body("{\"quantity\":4}").put(pledge(id)).then().statusCode(200).body("fulfilled", is(true));
        as(ben).body("{\"quantity\":1}").put(pledge(id)).then().statusCode(409).body("remaining", is(0));

        // Anna takes 3 instead of 4, so Ben can take the last one.
        as(anna).body("{\"quantity\":3}").put(pledge(id)).then().statusCode(200)
                .body("remaining", is(1)).body("fulfilled", is(false)).body("pledges.size()", is(1));
        as(ben).body("{\"quantity\":1}").put(pledge(id)).then().statusCode(200).body("fulfilled", is(true));

        // The own pledge does not count against the limit when changing it.
        as(ben).body("{\"quantity\":1}").put(pledge(id)).then().statusCode(200);
        as(ben).body("{\"quantity\":2}").put(pledge(id)).then().statusCode(409).body("remaining", is(1));
    }

    @Test
    void withdrawingRecomputesAndIsIdempotent() {
        int id = createItem("Chips", 3);
        as(anna).body("{\"quantity\":3}").put(pledge(id)).then().statusCode(200);
        as(anna).delete(pledge(id)).then().statusCode(204);
        as(anna).delete(pledge(id)).then().statusCode(204);
        as(anna).get(base()).then().body("[0].pledged", is(0)).body("[0].remaining", is(3));
    }

    @Test
    void invalidAndForeignPledgesAreRejected() {
        int id = createItem("Chips", 3);
        as(anna).body("{\"quantity\":0}").put(pledge(id)).then().statusCode(400);
        as(anna).body("{\"quantity\":1.5}").put(pledge(id)).then().statusCode(400);
        as(anna).body("{}").put(pledge(id)).then().statusCode(400);
        as(outsider).body("{\"quantity\":1}").put(pledge(id)).then().statusCode(403);
        as(anna).get(base()).then().body("[0].pledged", is(0));
    }

    @Test
    void hostMayLowerQuantityBelowPledges() {
        int id = createItem("Chips", 3);
        as(anna).body("{\"quantity\":3}").put(pledge(id)).then().statusCode(200);
        as(hostId).body("{\"name\":\"Chips\",\"quantity\":2}").put(base() + "/items/" + id).then().statusCode(200)
                .body("pledged", is(3)).body("remaining", is(0)).body("fulfilled", is(true));
    }

    @Test
    void deletingAnItemRemovesItsPledges() {
        int id = createItem("Chips", 3);
        as(anna).body("{\"quantity\":1}").put(pledge(id)).then().statusCode(200);
        as(hostId).delete(base() + "/items/" + id).then().statusCode(204);
        as(anna).get(base()).then().body("size()", is(0));
        QuarkusTransaction.requiringNew().run(() -> Assertions.assertEquals(0L,
                em.createQuery("select count(p) from BringAlongPledge p", Long.class).getSingleResult()));
    }

    @Test
    void leavingThePartyFreesPledges() {
        int id = createItem("Chips", 3);
        as(anna).body("{\"quantity\":2}").put(pledge(id)).then().statusCode(200);
        as(ben).body("{\"quantity\":1}").put(pledge(id)).then().statusCode(200);

        as(anna).delete("/api/parties/" + partyId + "/join").then().statusCode(200);

        as(ben).get(base()).then().body("[0].remaining", is(2)).body("[0].fulfilled", is(false))
                .body("[0].pledges.size()", is(1));
        as(cleo).body("{\"quantity\":2}").put(pledge(id)).then().statusCode(200).body("fulfilled", is(true));
        as(anna).get(base()).then().statusCode(403);
    }

    @Test
    void deletingThePartyRemovesItemsAndPledges() {
        int id = createItem("Chips", 3);
        as(anna).body("{\"quantity\":1}").put(pledge(id)).then().statusCode(200);
        as(hostId).delete("/api/parties/" + partyId).then().statusCode(204);
        QuarkusTransaction.requiringNew().run(() -> {
            Assertions.assertEquals(0L, em.createQuery("select count(i) from BringAlongItem i", Long.class).getSingleResult());
            Assertions.assertEquals(0L, em.createQuery("select count(p) from BringAlongPledge p", Long.class).getSingleResult());
        });
    }

    @Test
    void everyCommittedWriteNotifiesOnceAndRejectedWritesDoNot() {
        int id = createItem("Chips", 3);                                                   // 1
        as(hostId).body("{\"name\":\"Chips\",\"quantity\":2}").put(base() + "/items/" + id); // 2
        as(anna).body("{\"quantity\":2}").put(pledge(id)).then().statusCode(200);           // 3
        as(ben).body("{\"quantity\":1}").put(pledge(id)).then().statusCode(409);
        as(ben).body("{\"quantity\":1.5}").put(pledge(id)).then().statusCode(400);
        as(outsider).body("{\"quantity\":1}").put(pledge(id)).then().statusCode(403);
        as(ben).delete(pledge(id)).then().statusCode(204);                                 // nothing to withdraw
        as(anna).delete(pledge(id)).then().statusCode(204);                                // 4
        as(anna).body("{\"quantity\":1}").put(pledge(id)).then().statusCode(200);           // 5
        as(anna).delete("/api/parties/" + partyId + "/join").then().statusCode(200);       // 6
        as(hostId).delete(base() + "/items/" + id).then().statusCode(204);                 // 7
        Assertions.assertEquals(7, recorder.count(partyId));
    }

    @Test
    void eventStreamDeliversChangesToMembersOnly() throws Exception {
        as(outsider).accept("text/event-stream").get(base() + "/events").then().statusCode(403);
        given().accept("text/event-stream").get(base() + "/events").then().statusCode(401);

        BlockingQueue<String> lines = new LinkedBlockingQueue<>();
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:8082" + base() + "/events"))
                .header("X-User-Id", anna.toString()).header("Accept", "text/event-stream").GET().build();
        HttpResponse<Stream<String>> response = client.send(request, HttpResponse.BodyHandlers.ofLines());
        Assertions.assertEquals(200, response.statusCode());
        Thread reader = Thread.ofVirtual().start(() -> {
            try {
                response.body().forEach(lines::add);
            } catch (RuntimeException closed) {
                // Stream closed at the end of the test.
            }
        });
        try {
            Assertions.assertEquals("event:changed", awaitEvent(lines), "initial event");

            int id = createItem("Chips", 3);
            Assertions.assertEquals("event:changed", awaitEvent(lines), "event after item was created");

            as(ben).body("{\"quantity\":1}").put(pledge(id)).then().statusCode(200);
            Assertions.assertEquals("event:changed", awaitEvent(lines), "event after another user's pledge");
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
