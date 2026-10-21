package at.htl.resource;

import at.htl.TestBase;
import at.htl.location.Location;
import at.htl.party.Party;
import at.htl.user.User;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import java.time.LocalDateTime;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class FavoriteResourceTest extends TestBase {
    @Inject EntityManager em;
    Long partyId;
    Long viewerId;
    Long hostId;
    Long locationId;

    @BeforeEach
    void createData() {
        QuarkusTransaction.requiringNew().run(() -> {
            User host = user("favorite-host");
            User viewer = user("favorite-viewer");
            hostId = host.getId();
            viewerId = viewer.getId();
            Location location = new Location();
            location.setAddress("Favorite test venue");
            location.setLatitude(48.3);
            location.setLongitude(14.2);
            em.persist(location);
            locationId = location.getId();
            Party party = new Party();
            party.setHost_user(host);
            party.setLocation(location);
            party.setTitle("Favorite test party");
            party.setVisibility("PUBLIC");
            party.setTime_start(LocalDateTime.now().plusDays(1));
            em.persist(party);
            partyId = party.getId();
        });
    }

    private User user(String subject) {
        User user = new User();
        user.setKeycloakId(subject);
        user.setDistinctName(subject);
        user.setDisplayName(subject);
        user.setEmail(subject + "@example.com");
        em.persist(user);
        return user;
    }

    @AfterEach
    void cleanup() {
        QuarkusTransaction.requiringNew().run(() -> {
            em.remove(em.find(Party.class, partyId));
            em.remove(em.find(User.class, viewerId));
            em.remove(em.find(User.class, hostId));
            em.remove(em.find(Location.class, locationId));
        });
    }

    private String endpoint() { return "/api/parties/" + partyId + "/favorite"; }

    @Test
    @TestSecurity(user = "favorite-viewer", roles = "user")
    void saveIsPersistentIdempotentAndRemovable() {
        given().get(endpoint()).then().statusCode(200).body("favorite", is(false));
        given().put(endpoint()).then().statusCode(200).body("favorite", is(true));
        given().put(endpoint()).then().statusCode(200);
        given().get(endpoint()).then().statusCode(200).body("favorite", is(true));
        given().get("/api/favorites").then().statusCode(200)
                .body("size()", is(1)).body("[0].id", is(partyId.intValue()));
        given().delete(endpoint()).then().statusCode(204);
        given().delete(endpoint()).then().statusCode(204);
        given().get("/api/favorites").then().statusCode(200).body("size()", is(0));
    }

    @Test
    void anonymousUsersCannotReadOrChangeFavorites() {
        given().get("/api/favorites").then().statusCode(401);
        given().put(endpoint()).then().statusCode(401);
        given().delete(endpoint()).then().statusCode(401);
    }

    @Test
    @TestSecurity(user = "favorite-viewer", roles = "user")
    void cannotSaveInvisibleOrMissingParties() {
        QuarkusTransaction.requiringNew().run(() -> em.find(Party.class, partyId).setVisibility("PRIVATE"));
        given().put(endpoint()).then().statusCode(404);
        given().get(endpoint()).then().statusCode(404);
        given().put("/api/parties/9223372036854775807/favorite").then().statusCode(404);
    }

    @Test
    @TestSecurity(user = "favorite-viewer", roles = "user")
    void favoritesDoNotGrantAccessToPrivateParties() {
        given().put(endpoint()).then().statusCode(200);
        QuarkusTransaction.requiringNew().run(() -> em.find(Party.class, partyId).setVisibility("PRIVATE"));
        given().get("/api/favorites").then().statusCode(200).body("size()", is(0));
        given().delete(endpoint()).then().statusCode(204);
    }

    @Test
    @TestSecurity(user = "favorite-host", roles = "user")
    void listAndRemoveOnlyUseTheAuthenticatedUser() {
        QuarkusTransaction.requiringNew().run(() -> em.createNativeQuery(
                "insert into favorite(user_id, party_id) values (:userId, :partyId)")
                .setParameter("userId", viewerId).setParameter("partyId", partyId).executeUpdate());
        given().get("/api/favorites").then().statusCode(200).body("size()", is(0));
        given().delete(endpoint()).then().statusCode(204);
        QuarkusTransaction.requiringNew().run(() -> Assertions.assertEquals(1L,
                em.createQuery("select count(f) from Favorite f", Long.class).getSingleResult()));
    }
}
