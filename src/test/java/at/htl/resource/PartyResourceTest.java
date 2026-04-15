package at.htl.resource;

import at.htl.TestBase;
import at.htl.location.Location;
import at.htl.user.User;
import io.quarkus.test.junit.QuarkusTest;
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
            .header("X-User-Id", "1")
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
    void testJoinParty_notFound() {
        given()
            .header("X-User-Id", "1")
            .when().post("/api/parties/999/join")
            .then()
            .statusCode(404);
    }

    @Test
    void testLeaveParty_notFound() {
        given()
            .header("X-User-Id", "1")
            .when().delete("/api/parties/999/join")
            .then()
            .statusCode(404);
    }

    @Test
    void testJoinStatus_notFound() {
        given()
            .header("X-User-Id", "1")
            .when().get("/api/parties/999/join/status")
            .then()
            .statusCode(404);
    }

    @Test
    void testJoinParty_noUser() {
        given()
            .when().post("/api/parties/999/join")
            .then()
            .statusCode(400);
    }

    @Test
    void testLeaveParty_noUser() {
        given()
            .when().delete("/api/parties/999/join")
            .then()
            .statusCode(400);
    }

    @Test
    void testJoinStatus_noUser() {
        given()
            .when().get("/api/parties/999/join/status")
            .then()
            .statusCode(400);
    }
}
