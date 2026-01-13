package at.htl;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class ApiTest {

    private Long createdPartyId;

    @Test
    public void testGetAllParties() {
        given()
            .when().get("/api/party/")
            .then()
            .statusCode(200)
            .body("$", not(empty()))
            .body("size()", greaterThan(0))
            .body("[0]", hasKey("id"))
            .body("[0]", hasKey("title"))
            .body("[0]", hasKey("description"))
            .body("[0]", hasKey("host_user"));
    }

    @Test
    public void testCreateParty() {
        String partyPayload = """
            {
                "title": "Test Summer Picnic",
                "description": "A casual get-together in the park for testing.",
                "fee": 5.0,
                "time_start": "16.07.2025 12:00",
                "time_end": "16.07.2025 16:00",
                "max_people": 25,
                "min_age": 16,
                "max_age": 30,
                "website": "https://example.com/test-picnic",
                "latitude": 48.2082,
                "longitude": 16.3738,
                "category_id": 1
            }
            """;

        createdPartyId = given()
            .contentType("application/json")
            .body(partyPayload)
            .when().post("/api/party/add")
            .then()
            .statusCode(201)
            .body("title", equalTo("Test Summer Picnic"))
            .body("description", equalTo("A casual get-together in the park for testing."))
            .body("fee", equalTo(5.0f))
            .body("max_people", equalTo(25))
            .body("min_age", equalTo(16))
            .body("max_age", equalTo(30))
            .body("website", equalTo("https://example.com/test-picnic"))
            .body("location.latitude", equalTo(48.2082f))
            .body("location.longitude", equalTo(16.3738f))
            .extract()
            .path("id");
    }

    @Test
    public void testCreatePartyMinimalData() {
        String partyPayload = """
            {
                "title": "Minimal Party",
                "description": "Just the basics",
                "latitude": 48.2082,
                "longitude": 16.3738,
                "category_id": 1
            }
            """;

        given()
            .contentType("application/json")
            .body(partyPayload)
            .when().post("/api/party/add")
            .then()
            .statusCode(201)
            .body("title", equalTo("Minimal Party"))
            .body("description", equalTo("Just the basics"));
    }

    @Test
    public void testCreatePartyInvalidData() {
        String invalidPayload = """
            {
                "title": "",
                "description": "Missing required fields",
                "latitude": 48.2082,
                "longitude": 16.3738
            }
            """;

        given()
            .contentType("application/json")
            .body(invalidPayload)
            .when().post("/api/party/add")
            .then()
            .statusCode(400);
    }

    @Test
    public void testSortParties() {
        given()
            .queryParam("sort", "desc")
            .when().get("/api/party/sort")
            .then()
            .statusCode(200)
            .body("$", not(empty()));
    }

    @Test
    public void testSortPartiesAsc() {
        given()
            .queryParam("sort", "asc")
            .when().get("/api/party/sort")
            .then()
            .statusCode(200)
            .body("$", not(empty()));
    }

    @Test
    public void testFilterPartiesByContent() {
        String payload = """
            {
                "value": "Summer"
            }
            """;

        given()
            .contentType("application/json")
            .body(payload)
            .queryParam("filter", "content")
            .when().post("/api/party/filter")
            .then()
            .statusCode(200)
            .body("$", instanceOf(java.util.List.class));
    }

    @Test
    public void testFilterPartiesByCategory() {
        String payload = """
            {
                "value": "1"
            }
            """;

        given()
            .contentType("application/json")
            .body(payload)
            .queryParam("filter", "category")
            .when().post("/api/party/filter")
            .then()
            .statusCode(200)
            .body("$", instanceOf(java.util.List.class));
    }

    @Test
    public void testGetPartyById() {
        given()
            .when().get("/api/party/1")
            .then()
            .statusCode(200)
            .body("id", equalTo(1))
            .body("title", notNullValue())
            .body("description", notNullValue())
            .body("host_user", notNullValue());
    }

    @Test
    public void testGetPartyByIdNotFound() {
        given()
            .when().get("/api/party/99999")
            .then()
            .statusCode(404);
    }

    @Test
    public void testUpdatePartyById() {
        // First create a party to update
        String createPayload = """
            {
                "title": "Party to Update",
                "description": "Will be updated",
                "latitude": 48.2082,
                "longitude": 16.3738,
                "category_id": 1
            }
            """;

        Long partyId = given()
            .contentType("application/json")
            .body(createPayload)
            .when().post("/api/party/add")
            .then()
            .statusCode(201)
            .extract()
            .path("id");

        String updatePayload = """
            {
                "title": "Updated Party Title",
                "description": "Successfully updated description",
                "fee": 10.0,
                "max_people": 50,
                "latitude": 48.2082,
                "longitude": 16.3738,
                "category_id": 2
            }
            """;

        given()
            .contentType("application/json")
            .body(updatePayload)
            .when().post("/api/party/" + partyId)
            .then()
            .statusCode(200)
            .body("title", equalTo("Updated Party Title"))
            .body("description", equalTo("Successfully updated description"))
            .body("fee", equalTo(10.0f))
            .body("max_people", equalTo(50));
    }

    @Test
    public void testUpdatePartyNotFound() {
        String updatePayload = """
            {
                "title": "Updated Title",
                "description": "Updated description",
                "latitude": 48.2082,
                "longitude": 16.3738,
                "category_id": 1
            }
            """;

        given()
            .contentType("application/json")
            .body(updatePayload)
            .when().post("/api/party/99999")
            .then()
            .statusCode(404);
    }

    @Test
    public void testDeletePartyById() {
        // First create a party to delete
        String createPayload = """
            {
                "title": "Party to Delete",
                "description": "Will be deleted",
                "latitude": 48.2082,
                "longitude": 16.3738,
                "category_id": 1
            }
            """;

        Long partyId = given()
            .contentType("application/json")
            .body(createPayload)
            .when().post("/api/party/add")
            .then()
            .statusCode(201)
            .extract()
            .path("id");

        given()
            .when().delete("/api/party/" + partyId)
            .then()
            .statusCode(200);
    }

    @Test
    public void testDeletePartyNotFound() {
        given()
            .when().delete("/api/party/99999")
            .then()
            .statusCode(404);
    }

    @Test
    public void testAttendParty() {
        given()
            .when().post("/api/party/1/attend")
            .then()
            .statusCode(200);
    }

    @Test
    public void testAttendPartyNotFound() {
        given()
            .when().post("/api/party/99999/attend")
            .then()
            .statusCode(404);
    }

    @Test
    public void testLeaveParty() {
        // First attend a party
        given()
            .when().post("/api/party/2/attend")
            .then()
            .statusCode(200);

        // Then leave it
        given()
            .when().delete("/api/party/2/attend")
            .then()
            .statusCode(200);
    }

    @Test
    public void testLeavePartyNotAttending() {
        given()
            .when().delete("/api/party/3/attend")
            .then()
            .statusCode(400); // Or appropriate error code for not attending
    }

    @Test
    public void testAttendStatus() {
        given()
            .when().get("/api/party/1/attend/status")
            .then()
            .statusCode(200)
            .body("attending", anyOf(equalTo(true), equalTo(false)));
    }

    @Test
    public void testGetMediaForParty() {
        given()
            .when().get("/api/party/1/media")
            .then()
            .statusCode(200)
            .body("$", instanceOf(java.util.List.class));
    }

    @Test
    public void testGetMediaForPartyNotFound() {
        given()
            .when().get("/api/party/99999/media")
            .then()
            .statusCode(200)
            .body("$", empty());
    }
}
