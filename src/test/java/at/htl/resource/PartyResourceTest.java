package at.htl.resource;

import at.htl.TestBase;
import at.htl.category.Category;
import at.htl.location.Location;
import at.htl.user.User;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

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
        entityManager.createQuery("DELETE FROM Category").executeUpdate();
        entityManager.createQuery("DELETE FROM Location").executeUpdate();

        Category category = new Category();
        category.setName("Test Category");
        entityManager.persist(category);

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
            .when().get("/api/party/")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testGetPartyById_notFound() {
        given()
            .when().get("/api/party/999")
            .then()
            .statusCode(404);
    }

    @Test
    void testDeleteParty_notFound() {
        given()
            .when().delete("/api/party/999")
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
            .queryParam("user", 1)
            .when().post("/api/party/999")
            .then()
            .statusCode(404);
    }

    @Test
    void testSortParties_asc() {
        given()
            .queryParam("sort", "asc")
            .when().get("/api/party/sort")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testSortParties_desc() {
        given()
            .queryParam("sort", "desc")
            .when().get("/api/party/sort")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testAttendParty_notFound() {
        given()
            .queryParam("user", 1)
            .when().post("/api/party/999/attend")
            .then()
            .statusCode(404);
    }

    @Test
    void testLeaveParty_notFound() {
        given()
            .queryParam("user", 1)
            .when().delete("/api/party/999/attend")
            .then()
            .statusCode(404);
    }

    @Test
    void testAttendStatus_notFound() {
        given()
            .queryParam("user", 1)
            .when().get("/api/party/999/attend/status")
            .then()
            .statusCode(404);
    }

    @Test
    void testAttendParty_noUser() {
        given()
            .when().post("/api/party/999/attend")
            .then()
            .statusCode(400);
    }

    @Test
    void testLeaveParty_noUser() {
        given()
            .when().delete("/api/party/999/attend")
            .then()
            .statusCode(400);
    }

    @Test
    void testAttendStatus_noUser() {
        given()
            .when().get("/api/party/999/attend/status")
            .then()
            .statusCode(400);
    }
}
