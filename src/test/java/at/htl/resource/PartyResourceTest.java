package at.htl.resource;

import at.htl.TestBase;
import at.htl.invitation.Invitation;
import at.htl.location.Location;
import at.htl.party.Party;
import at.htl.user.User;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
@Transactional
public class PartyResourceTest extends TestBase {

    @Inject
    EntityManager entityManager;

    Location testLocation;
    User testUser;
    Long testPartyId;

    @BeforeEach
    void setUp() {
        entityManager.createQuery("DELETE FROM UserLocation").executeUpdate();
        entityManager.createQuery("DELETE FROM Notification").executeUpdate();
        entityManager.createQuery("DELETE FROM Invitation").executeUpdate();
        entityManager.createQuery("DELETE FROM Media").executeUpdate();
        entityManager.createQuery("DELETE FROM Party").executeUpdate();
        entityManager.createQuery("DELETE FROM UserNotificationSettings").executeUpdate();
        entityManager.createQuery("DELETE FROM User").executeUpdate();
        entityManager.createQuery("DELETE FROM Location").executeUpdate();

        testLocation = new Location();
        testLocation.setAddress("Test Address");
        testLocation.setLatitude(48.2082);
        testLocation.setLongitude(16.3738);
        entityManager.persist(testLocation);

        testUser = new User();
        testUser.setDisplayName("Test User");
        testUser.setDistinctName("testuser");
        testUser.setEmail("test@example.com");
        testUser.setKeycloakId("test-sub");
        entityManager.persist(testUser);

        Party party = new Party();
        party.setTitle("Test Party");
        party.setHost_user(testUser);
        party.setLocation(testLocation);
        party.setVisibility("PUBLIC");
        party.setTime_start(java.time.LocalDateTime.now());
        party.setTime_end(java.time.LocalDateTime.now().plusHours(4));
        entityManager.persist(party);

        User invUser = new User();
        invUser.setDisplayName("Invited User");
        invUser.setDistinctName("invuser");
        invUser.setEmail("inv@example.com");
        entityManager.persist(invUser);

        Invitation inv = new Invitation();
        inv.setParty(party);
        inv.setRecipient(invUser);
        inv.setSender(testUser);
        inv.setStatus("PENDING");
        entityManager.persist(inv);

        entityManager.flush();
        testPartyId = party.getId();
    }

    @Test
    void testGetAllParties() {
        given()
            .when().get("/api/parties")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testGetPartyById_notFound() {
        given()
            .when().get("/api/parties/999")
            .then()
            .statusCode(404);
    }

    @Test
    void testDeleteParty_notFound() {
        given()
            .when().delete("/api/parties/999")
            .then()
            .statusCode(404);
    }

    @Test
    @TestSecurity(user = "test-sub")
    void testUpdateParty_notFound() {
        String requestBody = """
            {
                "title": "Updated Party",
                "description": "Updated Description",
                "fee": 20.0
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().put("/api/parties/999")
            .then()
            .statusCode(404);
    }

    @Test
    void testSortParties_asc() {
        given()
            .queryParam("sort", "asc")
            .when().get("/api/parties")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testSortParties_desc() {
        given()
            .queryParam("sort", "desc")
            .when().get("/api/parties")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    @TestSecurity(user = "test-sub")
    void testJoinParty_notFound() {
        given()
            .when().post("/api/parties/999/join")
            .then()
            .statusCode(404);
    }

    @Test
    @TestSecurity(user = "test-sub")
    void testLeaveParty_notFound() {
        given()
            .when().delete("/api/parties/999/join")
            .then()
            .statusCode(404);
    }

    @Test
    @TestSecurity(user = "test-sub")
    void testJoinStatus_notFound() {
        given()
            .when().get("/api/parties/999/join/status")
            .then()
            .statusCode(404);
    }

    @Test
    void testJoinParty_noUser() {
        given()
            .when().post("/api/parties/999/join")
            .then()
            .statusCode(401);
    }

    @Test
    void testLeaveParty_noUser() {
        given()
            .when().delete("/api/parties/999/join")
            .then()
            .statusCode(401);
    }

    @Test
    void testJoinStatus_noUser() {
        given()
            .when().get("/api/parties/999/join/status")
            .then()
            .statusCode(401);
    }

    @Test
    void testCreateParty_noUser() {
        String requestBody = """
            {
                "title": "New Party",
                "description": "Test",
                "fee": 10.0,
                "time_start": "2024-12-01T20:00:00",
                "time_end": "2024-12-01T23:00:00",
                "max_people": 50,
                "min_age": 18,
                "max_age": 35,
                "latitude": 48.2,
                "longitude": 16.3,
                "address": "Test Address",
                "theme": "Test Theme",
                "visibility": "PUBLIC",
                "selectedUsers": []
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/parties")
            .then()
            .statusCode(401);
    }

    @Test
    void testDeleteParty_noUser() {
        given()
            .when().delete("/api/parties/999")
            .then()
            .statusCode(404);
    }

    @Test
    void testUpdateParty_noUser() {
        String requestBody = """
            {
                "title": "Updated Party"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().put("/api/parties/999")
            .then()
            .statusCode(401);
    }

    @Test
    @TestSecurity(user = "test-sub")
    void testCanEditParty_notFound() {
        given()
            .when().get("/api/parties/999/can-edit")
            .then()
            .statusCode(404);
    }

    @Test
    void testCanEditParty_noUser() {
        given()
            .when().get("/api/parties/999/can-edit")
            .then()
            .statusCode(401);
    }

    @Test
    void testGetPartyLocations_notFound() {
        given()
            .when().get("/api/parties/999/locations")
            .then()
            .statusCode(404);
    }

    @Test
    void testGetPartyMedia_notFound() {
        given()
            .when().get("/api/parties/999/media")
            .then()
            .statusCode(404);
    }

    @Test
    @TestSecurity(user = "test-sub")
    void testInvitedMembers_notFound() {
        given()
            .when().get("/api/parties/999/invited-members")
            .then()
            .statusCode(404);
    }

    @Test
    void testInvitedMembers_noUser() {
        given()
            .when().get("/api/parties/999/invited-members")
            .then()
            .statusCode(401);
    }

    @Test
    void testUpdateDeviceToken_noUser() {
        given()
            .queryParam("token", "test-token")
            .when().put("/api/parties/device-token")
            .then()
            .statusCode(401);
    }

    @Test
    @TestSecurity(user = "test-sub")
    void testUpdateDeviceToken_noToken() {
        given()
            .when().put("/api/parties/device-token")
            .then()
            .statusCode(400);
    }

    @Test
    void testFilterByTitle() {
        given()
            .queryParam("q", "nonexistent")
            .when().get("/api/parties")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testFilterByTheme() {
        given()
            .queryParam("theme", "nonexistent")
            .when().get("/api/parties")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testGetInvitationStats() {
        given()
            .header("X-User-Id", testUser.getId().toString())
            .when().get("/api/parties/" + testPartyId + "/invitation-stats")
            .then()
            .statusCode(200)
            .body("totalInvited", is(greaterThan(0)))
            .body("acceptedRatio", is(greaterThan(0.0f)));
    }

    @Test
    void testGetInvitationStats_notFound() {
        given()
            .header("X-User-Id", testUser.getId().toString())
            .when().get("/api/parties/99999/invitation-stats")
            .then()
            .statusCode(404);
    }

    @Test
    void testGetInvitationStats_noAuth() {
        given()
            .when().get("/api/parties/" + testPartyId + "/invitation-stats")
            .then()
            .statusCode(401);
    }
}
