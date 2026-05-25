package at.htl.resource;

import at.htl.TestBase;
import io.quarkus.test.junit.QuarkusTest;
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
    void testGetNotifications_withUser() {
        given()
            .header("X-User-Id", "2")
            .when().get("/api/notifications")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testGetNotifications_filterByParty() {
        given()
            .header("X-User-Id", "2")
            .queryParam("partyId", "4")
            .when().get("/api/notifications")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testGetNotifications_filterByType() {
        given()
            .header("X-User-Id", "2")
            .queryParam("type", "INVITATION")
            .when().get("/api/notifications")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testGetNotifications_filterBySearch() {
        given()
            .header("X-User-Id", "2")
            .queryParam("search", "invited")
            .when().get("/api/notifications")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testGetUnreadNotifications_noUser() {
        given()
            .when().get("/api/notifications/unread")
            .then()
            .statusCode(401);
    }

    @Test
    void testGetUnreadNotifications_withUser() {
        given()
            .header("X-User-Id", "2")
            .when().get("/api/notifications/unread")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testMarkAsRead_notFound() {
        given()
            .header("X-User-Id", "2")
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
    void testDeleteNotification_notFound() {
        given()
            .header("X-User-Id", "2")
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
