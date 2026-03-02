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
            .when().get("/api/invites/rec")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testGetSentInvites() {
        given()
            .when().get("/api/invites/inv")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testDeleteInvite_notFound() {
        given()
            .when().delete("/api/invites/delete/999")
            .then()
            .statusCode(404);
    }
}
