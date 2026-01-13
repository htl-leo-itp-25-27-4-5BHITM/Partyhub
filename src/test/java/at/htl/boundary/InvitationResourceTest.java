package at.htl.boundary;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class InvitationResourceTest {
    @Test
    void invite() {
        String payload = """
            {
                "recipient": 2,
                "partyId": 2
            }
            """;

        given()
            .contentType("application/json")
            .body(payload)
            .when().post("/api/invites/")
            .then()
            .statusCode(200)
            .body("size()", greaterThan(0))
            .body("[0]", hasKey("id"))
            .body("[0]", hasKey("recipient"))
            .body("[0]", hasKey("sender"))
            .body("[0]", hasKey("party"))
            .body("[0].recipient.id", equalTo(2))
            .body("[0].party.id", equalTo(2));
    }

    @Test
    void inviteInvalidRecipient() {
        String payload = """
            {
                "recipient": 99999,
                "partyId": 2
            }
            """;

        given()
            .contentType("application/json")
            .body(payload)
            .when().post("/api/invites/")
            .then()
            .statusCode(400);
    }

    @Test
    void inviteInvalidParty() {
        String payload = """
            {
                "recipient": 2,
                "partyId": 99999
            }
            """;

        given()
            .contentType("application/json")
            .body(payload)
            .when().post("/api/invites/")
            .then()
            .statusCode(400);
    }

    @Test
    void getReceivedInvites() {
        given()
            .when().get("/api/invites/rec")
            .then()
            .statusCode(200)
            .body("$", instanceOf(java.util.List.class));
    }

    @Test
    void getSentInvites() {
        given()
            .when().get("/api/invites/inv")
            .then()
            .statusCode(200)
            .body("$", instanceOf(java.util.List.class));
    }

    @Test
    void deleteInvite() {
        // First create an invitation to delete
        String payload = """
            {
                "recipient": 3,
                "partyId": 1
            }
            """;

        Long invitationId = given()
            .contentType("application/json")
            .body(payload)
            .when().post("/api/invites/")
            .then()
            .statusCode(200)
            .extract()
            .path("[0].id");

        // Now delete it
        given()
            .when().delete("/api/invites/delete/" + invitationId)
            .then()
            .statusCode(200);
    }

    @Test
    void deleteInviteNotFound() {
        given()
            .when().delete("/api/invites/delete/99999")
            .then()
            .statusCode(404);
    }

    @Test
    void inviteDuplicateShouldFail() {
        String payload = """
            {
                "recipient": 4,
                "partyId": 1
            }
            """;

        // First invitation should succeed
        given()
            .contentType("application/json")
            .body(payload)
            .when().post("/api/invites/")
            .then()
            .statusCode(200);

        // Second invitation with same recipient and party should fail or be handled appropriately
        given()
            .contentType("application/json")
            .body(payload)
            .when().post("/api/invites/")
            .then()
            .statusCode(anyOf(is(400), is(409))); // Bad Request or Conflict
    }
}