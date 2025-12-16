package at.htl.boundary;

import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.emptyArray;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.*;

class InvitationResourceTest {

    @Test
    void invite() {
        String payload = """
                {
                "recipient": 2,
                "partyId": 2
                }
                """ ;
        given()
                .contentType("application/json")
                .body(payload)
                .when().post("/api/invites/")
                .then()
                .statusCode(200)
                .body(not(emptyArray()));
    }

    @Test
    void getReceivedInvites() {

        given()
                .when().get("/api/invites/rec")
                .then()
                .statusCode(200);
    }

    @Test
    void getSentInvites() {

        given()
                .when().get("/api/invites/inv")
                .then()
                .statusCode(200);
    }

    @Test
    void deleteInvite() {
        given()
                .when().delete("/api/invites/2")
                .then()
                .statusCode(200);
    }
}