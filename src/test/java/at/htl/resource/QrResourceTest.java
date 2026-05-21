package at.htl.resource;

import at.htl.TestBase;
import at.htl.user.User;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
@Transactional
public class QrResourceTest extends TestBase {

    @Inject
    EntityManager entityManager;

    @BeforeEach
    @Transactional
    void setUp() {
        entityManager.createQuery("DELETE FROM QrLogin").executeUpdate();
        entityManager.createQuery("DELETE FROM User").executeUpdate();
        entityManager.flush();

        User user = new User();
        user.setDisplayName("Test User");
        user.setDistinctName("testuser");
        user.setEmail("test@example.com");
        user.setKeycloakId("test-sub");
        entityManager.persist(user);
        entityManager.flush();
    }

    @Test
    void testGenerate_noUserId() {
        given()
            .when().get("/api/qr/generate")
            .then()
            .statusCode(401);
    }

    @Test
    void testGenerate_userNotFound() {
        given()
            .queryParam("userId", 999)
            .when().get("/api/qr/generate")
            .then()
            .statusCode(401);
    }

    @Test
    @TestSecurity(user = "test-sub")
    void testGenerate_success() {
        User user = entityManager.createQuery("SELECT u FROM User u", User.class).getSingleResult();
        given()
            .when().get("/api/qr/generate")
            .then()
            .statusCode(200)
            .body("userId", notNullValue())
            .body("payload", containsString("partyhub://login"))
            .body("imageUrl", containsString("/api/qr/image/user/"));
    }

    @Test
    void testStatus_tokenNotFound() {
        given()
            .when().get("/api/qr/status/nonexistent")
            .then()
            .statusCode(404);
    }

    @Test
    void testImageByUserId_notFound() {
        given()
            .when().get("/api/qr/image/user/999")
            .then()
            .statusCode(404);
    }

    @Test
    void testImage_tokenNotFound() {
        given()
            .when().get("/api/qr/image/nonexistent")
            .then()
            .statusCode(404);
    }

    @Test
    void testExchange_noToken() {
        given()
            .contentType(ContentType.JSON)
            .body("{}")
            .when().post("/api/qr/exchange")
            .then()
            .statusCode(400);
    }

    @Test
    void testExchange_invalidToken() {
        given()
            .contentType(ContentType.JSON)
            .body("{\"token\": \"invalid\"}")
            .when().post("/api/qr/exchange")
            .then()
            .statusCode(404);
    }

    @Test
    void testMobileMe_noToken() {
        given()
            .contentType(ContentType.JSON)
            .body("{}")
            .when().post("/api/qr/mobile/me")
            .then()
            .statusCode(400);
    }

    @Test
    void testMobileMe_invalidJwt() {
        given()
            .contentType(ContentType.JSON)
            .body("{\"mobile_token\": \"invalid.jwt.token\"}")
            .when().post("/api/qr/mobile/me")
            .then()
            .statusCode(401);
    }
}
