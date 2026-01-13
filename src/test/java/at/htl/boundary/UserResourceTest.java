package at.htl.boundary;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class UserResourceTest {

    @Test
    void createUser() {
        String userPayload = """
            {
                "displayName": "Test User",
                "distinctName": "testuser",
                "email": "test@example.com",
                "biography": "A test user biography",
                "profilePicture": "default_profile-picture.jpg"
            }
            """;

        given()
            .contentType("application/json")
            .body(userPayload)
            .when().get("/api/users/")
            .then()
            .statusCode(200)
            .body("displayName", equalTo("Test User"))
            .body("distinctName", equalTo("testuser"))
            .body("email", equalTo("test@example.com"))
            .body("biography", equalTo("A test user biography"))
            .body("profileImage", equalTo("default_profile-picture.jpg"));
    }

    @Test
    void createUserWithMinimalData() {
        String userPayload = """
            {
                "displayName": "Minimal User",
                "distinctName": "minimal",
                "email": "minimal@example.com"
            }
            """;

        given()
            .contentType("application/json")
            .body(userPayload)
            .when().get("/api/users/")
            .then()
            .statusCode(200)
            .body("displayName", equalTo("Minimal User"))
            .body("distinctName", equalTo("minimal"))
            .body("email", equalTo("minimal@example.com"));
    }

    @Test
    void getUsers() {
        given()
            .when().get("/api/users/all")
            .then()
            .statusCode(200)
            .body("$", not(empty()))
            .body("size()", greaterThan(0))
            .body("[0]", hasKey("id"))
            .body("[0]", hasKey("displayName"))
            .body("[0]", hasKey("distinctName"))
            .body("[0]", hasKey("email"));
    }

    @Test
    void getUsersByDistinctNameSubstring() {
        given()
            .queryParam("name", "luk")
            .when().get("/api/users/all/search")
            .then()
            .statusCode(200)
            .body("$", not(empty()))
            .body("[0].distinctName", containsString("luk"));
    }

    @Test
    void getUsersByDistinctNameSubstringNoResults() {
        given()
            .queryParam("name", "nonexistentuser12345")
            .when().get("/api/users/all/search")
            .then()
            .statusCode(200)
            .body("$", empty());
    }

    @Test
    void getUser() {
        given()
            .when().get("/api/users/1")
            .then()
            .statusCode(200)
            .body("id", equalTo(1))
            .body("displayName", notNullValue())
            .body("distinctName", notNullValue())
            .body("email", notNullValue());
    }

    @Test
    void getUserNotFound() {
        given()
            .when().get("/api/users/99999")
            .then()
            .statusCode(404);
    }

    @Test
    void getUserByDistinctName() {
        given()
            .when().get("/api/users/handle/lukas")
            .then()
            .statusCode(200)
            .body("distinctName", equalTo("lukas"))
            .body("displayName", equalTo("Lukas"));
    }

    @Test
    void getUserByDistinctNameNotFound() {
        given()
            .when().get("/api/users/handle/nonexistentuser")
            .then()
            .statusCode(404);
    }

    @Test
    void getProfilePicture() {
        given()
            .when().get("/api/users/1/profile-picture")
            .then()
            .statusCode(200)
            .contentType(containsString("image/"));
    }

    @Test
    void getProfilePictureUserNotFound() {
        given()
            .when().get("/api/users/99999/profile-picture")
            .then()
            .statusCode(404);
    }

    @Test
    void getProfilePictureDefaultImage() {
        // Test with a user that has default profile picture
        given()
            .when().get("/api/users/1/profile-picture")
            .then()
            .statusCode(200)
            .contentType("image/jpeg");
    }
}