package at.htl;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class ApiTest {
    @Test
    public void testGetAllParties() {
        given()
                .when().get("/api/party/")
                .then()
                .statusCode(200)
                .body(not(emptyArray()));
    }

    @Test
    public void testCreateParty() {
        String partyPayload =
                """ 
                  {
                  "title": "Yet Another Summer Picnic",
                  "description": "Casual get‑together in the park.",
                  "fee": 3,
                  "time_start": "16.07.2025 12:00",
                  "time_end": "16.07.2025 16:00",
                  "max_people": 30,
                  "min_age": 12,
                  "max_age": 65,
                  "website": "https://example.com/picnic",
                  "latitude": 48.2082,
                  "longitude": 16.3738,
                  "category_id": 2
                }
                """;

        given()
                .contentType("application/json")
                .body(partyPayload)
                .when().post("/api/party/add")
                .then()
                .statusCode(201);
    }

    @Test
    public void testSortParties() {
        String randomSortKey = "desc";

        given()
                .when().get("/api/party/sort?sort=" + randomSortKey)
                .then()
                .statusCode(200)
                .body(not(emptyArray()));
    }

    @Test
    public void testFilterPartiesByContent() {
        String payload =
                """ 
                          {
                          "value": "a"
                        }
                        """;

        given()
                .contentType("application/json")
                .body(payload)
                .when().post("/api/party/filter?filter=content")
                .then()
                .statusCode(200).body(not(emptyArray()));
    }

    @Test
    public void testGetPartyById() {
        int id = 1;

        given()
                .when().get("/api/party/" + id)
                .then()
                .statusCode(200)
                .body("id", is(id));
    }

    @Test
    public void testUpdatePartyById() {
        long id = 1;

        String updatePayload =
        """ 
                  {
                  "title": "UPDATED Picnic",
                  "description": "A casual get‑together in the park.",
                  "fee": 100000,
                  "time_start": "15.07.2025 12:00",
                  "time_end": "15.07.2025 16:00",
                  "max_people": 30,
                  "min_age": 12,
                  "max_age": 65,
                  "website": "https://example.com/picnic",
                  "latitude": 48.2082,
                  "longitude": 16.3738,
                  "category_id": 3
                }
                """;

        given()
                .contentType("application/json")
                .body(updatePayload)
                .when().post("/api/party/" + id)
                .then()
                .statusCode(200);
    }

    @Test
    public void testDeletePartyById() {
        long id = 1;

        given()
                .when().delete("/api/party/" + id)
                .then()
                .statusCode(204);
    }

    @Test
    public void testAttendParty() {
        long id = 1;

        given()
                .when().post("/api/party/" + id + "/attend")
                .then()
                .statusCode(204);
    }


    @Test
    public void testLeaveParty() {
        long id = 1;

        given().post("/api/party/" + id + "/attend");
        given()
                .when().delete("/api/party/" + id + "/attend")
                .then()
                .statusCode(200);
    }

    @Test
    public void testGetMediaForParty() {
        long id = 1;

        given()
                .when().get("/api/party/" + id + "/media")
                .then()
                .statusCode(200);
    }

    @Test
    public void testGetAllUsers() {
        given()
                .when().get("/api/users/")
                .then()
                .statusCode(200)
                .body(not(emptyArray()));
    }

    @Test
    public void testGetUserById() {
        int id = 1;

        given()
                .when().get("/api/users/" + id)
                .then()
                .statusCode(200)
                .body("id", is(id));
    }
}
