package at.htl.resource;

import at.htl.TestBase;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class InvitationResourceTest extends TestBase {

    @Test
    void testGetReceivedInvites() {
        given()
            .queryParam("user", 1)
            .when().get("/api/invitations")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testGetSentInvites() {
        given()
            .queryParam("user", 1)
            .queryParam("direction", "sent")
            .when().get("/api/invitations")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testDeleteInvite_notFound() {
        given()
            .queryParam("user", 1)
            .when().delete("/api/invitations/999")
            .then()
            .statusCode(404);
    }

    @Test
    void testGetReceivedInvites_noUser() {
        given()
            .when().get("/api/invitations")
            .then()
            .statusCode(400);
    }

    @Test
    void testGetSentInvites_noUser() {
        given()
            .queryParam("direction", "sent")
            .when().get("/api/invitations")
            .then()
            .statusCode(400);
    }
}
