package at.htl.resource;

import at.htl.TestBase;
import at.htl.location.Location;
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

    @BeforeEach
    void setUp() {
        entityManager.createQuery("DELETE FROM UserLocation").executeUpdate();
        entityManager.createQuery("DELETE FROM Notification").executeUpdate();
        entityManager.createQuery("DELETE FROM Invitation").executeUpdate();
        entityManager.createQuery("DELETE FROM Media").executeUpdate();
        entityManager.createQuery("DELETE FROM Party").executeUpdate();
        entityManager.createQuery("DELETE FROM User").executeUpdate();
        entityManager.createQuery("DELETE FROM Location").executeUpdate();

        Location location = new Location();
        location.setAddress("Test Address");
        location.setLatitude(48.2082);
        location.setLongitude(16.3738);
        entityManager.persist(location);

        User user = new User();
        user.setDisplayName("Test User");
        user.setDistinctName("testuser");
        user.setEmail("test@example.com");
        user.setKeycloakId("test-sub");
        entityManager.persist(user);

        entityManager.flush();
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
}
