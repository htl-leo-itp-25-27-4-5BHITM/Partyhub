package at.htl.resource;

import at.htl.TestBase;
import at.htl.user.User;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.UserTransaction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class UserLocationResourceTest extends TestBase {

    @Inject
    EntityManager em;

    @Inject
    UserTransaction tx;

    @BeforeEach
    void setUp() throws Exception {
        tx.begin();
        em.createQuery("DELETE FROM UserLocation").executeUpdate();
        em.createQuery("DELETE FROM Invitation").executeUpdate();
        em.createQuery("DELETE FROM Media").executeUpdate();
        em.createQuery("DELETE FROM ProfilePicture").executeUpdate();
        em.createQuery("DELETE FROM Follow").executeUpdate();
        em.createQuery("DELETE FROM Party").executeUpdate();
        em.createQuery("DELETE FROM User").executeUpdate();
        tx.commit();
    }

    @Test
    void testGetAllLocations_empty() {
        given()
            .when().get("/api/userLocation")
            .then()
            .statusCode(200)
            .body("$", is(empty()));
    }

    @Test
    void testUpdateLocation_createNew() throws Exception {
        tx.begin();
        User user = new User();
        user.setDisplayName("Test User");
        user.setDistinctName("testuser");
        user.setEmail("test@example.com");
        em.persist(user);
        tx.commit();
        
        Long userId = user.getId();

        String requestBody = String.format(
            "{\"userId\": %d, \"latitude\": 48.2082, \"longitude\": 16.3738}",
            userId
        );

        given()
            .contentType("application/json")
            .body(requestBody)
            .when().post("/api/userLocation")
            .then()
            .statusCode(200)
            .body("latitude", is(48.2082f))
            .body("longitude", is(16.3738f))
            .body("user.id", is(userId.intValue()));
    }

    @Test
    void testUpdateLocation_updateExisting() throws Exception {
        tx.begin();
        User user = new User();
        user.setDisplayName("Test User");
        user.setDistinctName("testuser");
        user.setEmail("test@example.com");
        em.persist(user);
        tx.commit();
        
        Long userId = user.getId();

        String requestBody1 = String.format(
            "{\"userId\": %d, \"latitude\": 48.2082, \"longitude\": 16.3738}",
            userId
        );

        given()
            .contentType("application/json")
            .body(requestBody1)
            .when().post("/api/userLocation")
            .then()
            .statusCode(200)
            .body("latitude", is(48.2082f));

        String requestBody2 = String.format(
            "{\"userId\": %d, \"latitude\": 52.52, \"longitude\": 13.405}",
            userId
        );

        given()
            .contentType("application/json")
            .body(requestBody2)
            .when().post("/api/userLocation")
            .then()
            .statusCode(200)
            .body("latitude", is(52.52f))
            .body("longitude", is(13.405f));
    }

    @Test
    void testUpdateLocation_userNotFound() {
        String requestBody = "{\"userId\": 9999, \"latitude\": 48.2082, \"longitude\": 16.3738}";

        given()
            .contentType("application/json")
            .body(requestBody)
            .when().post("/api/userLocation")
            .then()
            .statusCode(404)
            .body("error", is("User not found"));
    }

    @Test
    void testGetLocationsByParty_empty() {
        given()
            .when().get("/api/userLocation/party/1")
            .then()
            .statusCode(200)
            .body("$", is(empty()));
    }
}
