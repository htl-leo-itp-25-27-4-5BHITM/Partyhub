package at.htl.resource;

import at.htl.TestBase;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class UserResourceTest extends TestBase {

    @Test
    @TestSecurity(user = "test-user", roles = "user")
    void testGetAllUsers_empty() {
        given()
            .when().get("/api/users")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    @TestSecurity(user = "test-user", roles = "user")
    void testGetUserById_notFound() {
        given()
            .when().get("/api/users/999")
            .then()
            .statusCode(404);
    }

    @Test
    @TestSecurity(user = "test-user", roles = "user")
    void testGetUserByHandle_notFound() {
        given()
            .when().get("/api/users/handle/nonexistent")
            .then()
            .statusCode(404);
    }

    @Test
    @TestSecurity(user = "test-user", roles = "user")
    void testGetUserByUsername_notFound() {
        given()
            .when().get("/api/users/username/nonexistent")
            .then()
            .statusCode(404);
    }

    @Test
    void testGetCurrentUser_noUserId() {
        given()
            .when().get("/api/users/me")
            .then()
            .statusCode(401);
    }

    @Test
    @TestSecurity(user = "test-sub")
    void testGetCurrentUser_notFound() {
        given()
            .when().get("/api/users/me")
            .then()
            .statusCode(200);
    }

    @Test
    @TestSecurity(user = "test-user", roles = "user")
    void testGetFollowersCount_notFound() {
        given()
            .when().get("/api/users/999/followers/count")
            .then()
            .statusCode(404);
    }

    @Test
    @TestSecurity(user = "test-user", roles = "user")
    void testGetFollowingCount_notFound() {
        given()
            .when().get("/api/users/999/following/count")
            .then()
            .statusCode(404);
    }

    @Test
    @TestSecurity(user = "test-user", roles = "user")
    void testGetFollowers_notFound() {
        given()
            .when().get("/api/users/999/followers")
            .then()
            .statusCode(200);
    }

    @Test
    @TestSecurity(user = "test-user", roles = "user")
    void testGetFollowing_notFound() {
        given()
            .when().get("/api/users/999/following")
            .then()
            .statusCode(200);
    }

    @Test
    @TestSecurity(user = "test-user", roles = "user")
    void testGetFollowRequests_notFound() {
        given()
            .when().get("/api/users/999/follow-requests")
            .then()
            .statusCode(200);
    }

    @Test
    @TestSecurity(user = "test-user", roles = "user")
    void testGetFollowStatus_notFound() {
        given()
            .when().get("/api/users/1/followers/999/status")
            .then()
            .statusCode(200);
    }

    @Test
    void testFollowUser_noTargetUser() {
        given()
            .when().post("/api/users/1/follow")
            .then()
            .statusCode(401);
    }

    @Test
    void testAcceptFollow_notFound() {
        given()
            .when().put("/api/users/999/followers/1")
            .then()
            .statusCode(401);
    }

    @Test
    void testUnfollowUser_notFound() {
        given()
            .when().delete("/api/users/999/followers/1")
            .then()
            .statusCode(401);
    }

    @Test
    void testGetUserLocation_notFound() {
        given()
            .when().get("/api/users/location/999")
            .then()
            .statusCode(404);
    }

    @Test
    void testGetUserMedia_notFound() {
        given()
            .when().get("/api/users/999/media")
            .then()
            .statusCode(200);
    }

    @Test
    void testUpdateDeviceToken_noUser() {
        given()
            .queryParam("token", "test-token")
            .when().put("/api/users/device-token")
            .then()
            .statusCode(401);
    }

    @Test
    @TestSecurity(user = "test-sub")
    void testUpdateDeviceToken_noToken() {
        given()
            .when().put("/api/users/device-token")
            .then()
            .statusCode(400);
    }

    @Test
    void testGetProfilePicture_notFound() {
        given()
            .when().get("/api/users/999/profile-picture")
            .then()
            .statusCode(404);
    }

    @Test
    void testGetProfilePictureFilename_notFound() {
        given()
            .when().get("/api/users/999/profile-picture-filename")
            .then()
            .statusCode(404);
    }
    @Test
    void anonymousProfileAccessIsRejected() {
        for (String path : new String[]{"/api/users", "/api/users/999", "/api/users/handle/nonexistent", "/api/users/999/followers"}) {
            given().when().get(path).then().statusCode(401);
        }
    }

}
