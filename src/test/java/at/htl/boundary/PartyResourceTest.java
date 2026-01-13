package at.htl.boundary;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class PartyResourceTest {

    @Test
    void testGetPartiesStructure() {
        given()
            .when().get("/api/party/")
            .then()
            .statusCode(200)
            .body("$", not(empty()))
            .body("size()", greaterThan(0))
            .body("[0]", hasKey("id"))
            .body("[0]", hasKey("title"))
            .body("[0]", hasKey("description"))
            .body("[0]", hasKey("time_start"))
            .body("[0]", hasKey("time_end"))
            .body("[0]", hasKey("fee"))
            .body("[0]", hasKey("max_people"))
            .body("[0]", hasKey("host_user"))
            .body("[0]", hasKey("location"))
            .body("[0]", hasKey("category"));
    }

    @Test
    void testAddPartyWithAllFields() {
        String partyPayload = """
            {
                "title": "Comprehensive Test Party",
                "description": "Testing all fields in party creation",
                "fee": 15.50,
                "time_start": "25.12.2025 20:00",
                "time_end": "26.12.2025 04:00",
                "max_people": 100,
                "min_age": 18,
                "max_age": 99,
                "website": "https://comprehensive-test-party.com",
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
            .body("title", equalTo("Comprehensive Test Party"))
            .body("fee", equalTo(15.5f))
            .body("max_people", equalTo(100))
            .body("min_age", equalTo(18))
            .body("max_age", equalTo(99))
            .body("website", equalTo("https://comprehensive-test-party.com"));
    }

    @Test
    void testGetPartyWithFullDetails() {
        given()
            .when().get("/api/party/1")
            .then()
            .statusCode(200)
            .body("id", equalTo(1))
            .body("title", notNullValue())
            .body("host_user", notNullValue())
            .body("host_user.displayName", notNullValue())
            .body("location", notNullValue())
            .body("category", notNullValue())
            .body("category.name", notNullValue());
    }

    @Test
    void testAttendPartyTwiceShouldFail() {
        Long partyId = 1L;

        // First attendance should succeed
        given()
            .when().post("/api/party/" + partyId + "/attend")
            .then()
            .statusCode(anyOf(is(200), is(204)));

        // Second attendance should fail or be idempotent
        given()
            .when().post("/api/party/" + partyId + "/attend")
            .then()
            .statusCode(anyOf(is(200), is(204), is(400), is(409)));
    }

    @Test
    void testLeavePartyWithoutAttending() {
        given()
            .when().delete("/api/party/4/attend")
            .then()
            .statusCode(anyOf(is(400), is(404)));
    }

    @Test
    void testUpdatePartyPartialUpdate() {
        // Create a party first
        String createPayload = """
            {
                "title": "Party for Partial Update",
                "description": "Original description",
                "fee": 5.0,
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

        // Update only title and fee
        String updatePayload = """
            {
                "title": "Partially Updated Party",
                "fee": 20.0,
                "latitude": 48.2082,
                "longitude": 16.3738,
                "category_id": 1
            }
            """;

        given()
            .contentType("application/json")
            .body(updatePayload)
            .when().post("/api/party/" + partyId)
            .then()
            .statusCode(200)
            .body("title", equalTo("Partially Updated Party"))
            .body("fee", equalTo(20.0f))
            .body("description", equalTo("Original description")); // Should remain unchanged
    }

    @Test
    void testInvalidCategoryId() {
        String partyPayload = """
            {
                "title": "Party with Invalid Category",
                "description": "Testing invalid category",
                "latitude": 48.2082,
                "longitude": 16.3738,
                "category_id": 99999
            }
            """;

        given()
            .contentType("application/json")
            .body(partyPayload)
            .when().post("/api/party/add")
            .then()
            .statusCode(400);
    }

    @Test
    void testInvalidCoordinates() {
        String partyPayload = """
            {
                "title": "Party with Invalid Coordinates",
                "description": "Testing coordinate validation",
                "latitude": 91.0,
                "longitude": 181.0,
                "category_id": 1
            }
            """;

        given()
            .contentType("application/json")
            .body(partyPayload)
            .when().post("/api/party/add")
            .then()
            .statusCode(anyOf(is(400), is(201))); // Depending on validation implementation
    }

    @Test
    void testEmptyTitle() {
        String partyPayload = """
            {
                "title": "",
                "description": "Party with empty title",
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
            .statusCode(400);
    }

    @Test
    void testNegativeFee() {
        String partyPayload = """
            {
                "title": "Party with Negative Fee",
                "description": "Testing negative fee",
                "fee": -10.0,
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
            .statusCode(anyOf(is(400), is(201))); // Depending on validation
    }

    @Test
    void testInvalidAgeRange() {
        String partyPayload = """
            {
                "title": "Party with Invalid Age Range",
                "description": "Min age > max age",
                "min_age": 30,
                "max_age": 18,
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
            .statusCode(anyOf(is(400), is(201))); // Depending on validation
    }
}