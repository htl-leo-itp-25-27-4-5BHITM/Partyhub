package at.htl.resource;

import at.htl.TestBase;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class InvitationResourceTest extends TestBase {

    @Test
    @TestSecurity(user = "test-sub")
    void testGetReceivedInvites() {
        given()
            .when().get("/api/invitations")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    @TestSecurity(user = "test-sub")
    void testGetSentInvites() {
        given()
            .queryParam("direction", "sent")
            .when().get("/api/invitations")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    @TestSecurity(user = "test-sub")
    void testDeleteInvite_notFound() {
        given()
            .when().delete("/api/invitations/999")
            .then()
            .statusCode(404);
    }

    @Test
    void testGetReceivedInvites_noUser() {
        given()
            .when().get("/api/invitations")
            .then()
            .statusCode(401);
    }

    @Test
    void testGetSentInvites_noUser() {
        given()
            .queryParam("direction", "sent")
            .when().get("/api/invitations")
            .then()
            .statusCode(401);
    }
}
