package at.htl.resource;

import at.htl.TestBase;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
@TestSecurity(authorizationEnabled = false)
public class InvitationResourceTest extends TestBase {

    @Test
    void testGetReceivedInvites() {
        given()
            .queryParam("user", "00000000-0000-0000-0000-000000000001")
            .when().get("/api/invites/rec")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testGetSentInvites() {
        given()
            .queryParam("user", "00000000-0000-0000-0000-000000000001")
            .when().get("/api/invites/inv")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testDeleteInvite_notFound() {
        given()
            .queryParam("user", "00000000-0000-0000-0000-000000000001")
            .when().delete("/api/invites/delete/999")
            .then()
            .statusCode(404);
    }

    @Test
    void testGetReceivedInvites_noUser() {
        given()
            .when().get("/api/invites/rec")
            .then()
            .statusCode(400);
    }

    @Test
    void testGetSentInvites_noUser() {
        given()
            .when().get("/api/invites/inv")
            .then()
            .statusCode(400);
    }
}
