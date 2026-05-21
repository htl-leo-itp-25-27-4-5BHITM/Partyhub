package at.htl.resource;

import at.htl.TestBase;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class NotificationResourceTest extends TestBase {

    @Test
    void testGetNotifications_noUser() {
        given()
            .when().get("/api/notifications")
            .then()
            .statusCode(401);
    }

    @Test
    @TestSecurity(user = "test-sub")
    void testGetNotifications_withUserId() {
        given()
            .when().get("/api/notifications")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testGetNotifications_withHeader() {
        given()
            .header("X-User-Id", "1")
            .when().get("/api/notifications")
            .then()
            .statusCode(401);
    }

    @Test
    void testGetUnreadNotifications_noUser() {
        given()
            .when().get("/api/notifications/unread")
            .then()
            .statusCode(401);
    }

    @Test
    @TestSecurity(user = "test-sub")
    void testGetUnreadNotifications_withUserId() {
        given()
            .when().get("/api/notifications/unread")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    @TestSecurity(user = "test-sub")
    void testMarkAsRead_notFound() {
        given()
            .when().post("/api/notifications/999/read")
            .then()
            .statusCode(404);
    }

    @Test
    void testMarkAsRead_noUser() {
        given()
            .when().post("/api/notifications/999/read")
            .then()
            .statusCode(401);
    }

    @Test
    @TestSecurity(user = "test-sub")
    void testDeleteNotification_notFound() {
        given()
            .when().delete("/api/notifications/999")
            .then()
            .statusCode(404);
    }

    @Test
    void testDeleteNotification_noUser() {
        given()
            .when().delete("/api/notifications/999")
            .then()
            .statusCode(401);
    }
}
