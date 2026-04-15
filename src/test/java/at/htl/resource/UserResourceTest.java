package at.htl.resource;

import at.htl.TestBase;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class UserResourceTest extends TestBase {

    @Test
    void testGetAllUsers_empty() {
        given()
            .when().get("/api/users")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testGetUserById_notFound() {
        given()
            .when().get("/api/users/999")
            .then()
            .statusCode(404);
    }

    @Test
    void testGetUserByHandle_notFound() {
        given()
            .when().get("/api/users/handle/nonexistent")
            .then()
            .statusCode(404);
    }

    @Test
    void testGetFollowersCount_notFound() {
        given()
            .when().get("/api/users/999/followers/count")
            .then()
            .statusCode(404);
    }

    @Test
    void testGetFollowingCount_notFound() {
        given()
            .when().get("/api/users/999/following/count")
            .then()
            .statusCode(404);
    }

    @Test
    void testGetUserByHandle() {
        given()
            .when().get("/api/users/handle/doesnotexist")
            .then()
            .statusCode(404);
    }
}
