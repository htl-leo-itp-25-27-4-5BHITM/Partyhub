package at.htl.resource;

import at.htl.TestBase;
import at.htl.user.User;
import at.htl.user_location.UserLocation;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;

@QuarkusTest
public class UserResourceTest extends TestBase {

    @Inject
    EntityManager em;

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
    void testGetUserLocation_noUser() {
        given()
            .when().get("/api/users/location/999")
            .then()
            .statusCode(401);
    }

    @Test
    @TestSecurity(user = "loc-a-sub")
    void testGetUserLocation_otherUserForbidden() {
        Long[] ids = createLocationUsers();
        persistLocation(ids[1], 48.1, 14.1);
        given()
            .when().get("/api/users/location/{id}", ids[1])
            .then()
            .statusCode(403);
    }

    @Test
    @TestSecurity(user = "loc-a-sub")
    void testGetUserLocation_selfWithoutLocation() {
        Long[] ids = createLocationUsers();
        given()
            .when().get("/api/users/location/{id}", ids[0])
            .then()
            .statusCode(404);
    }

    @Test
    @TestSecurity(user = "loc-a-sub")
    void testGetUserLocation_selfGetsBoundedProjection() {
        Long[] ids = createLocationUsers();
        persistLocation(ids[0], 48.3, 14.3);
        given()
            .when().get("/api/users/location/{id}", ids[0])
            .then()
            .statusCode(200)
            .body("latitude", is(48.3f))
            .body("longitude", is(14.3f))
            .body("user.id", is(ids[0].intValue()))
            .body("user.displayName", is("Location A"))
            .body("user", not(hasKey("email")))
            .body("user", not(hasKey("biography")));
    }

    @Test
    @TestSecurity(user = "loc-a-sub")
    void testUpdateUserLocation_keepsOneRowAndLeavesOthersAlone() {
        Long[] ids = createLocationUsers();
        persistLocation(ids[1], 47.0, 13.0);

        for (double lat : new double[]{48.0, 48.5}) {
            given()
                .contentType(ContentType.JSON)
                .body("{\"latitude\": " + lat + ", \"longitude\": 14.0}")
                .when().put("/api/users/location")
                .then()
                .statusCode(200)
                .body("latitude", is((float) lat))
                .body("user.id", is(ids[0].intValue()));
        }

        List<UserLocation> own = locationsOf(ids[0]);
        assertEquals(1, own.size());
        assertEquals(48.5, own.get(0).getLatitude());
        List<UserLocation> other = locationsOf(ids[1]);
        assertEquals(1, other.size());
        assertEquals(47.0, other.get(0).getLatitude());
    }

    private Long[] createLocationUsers() {
        return QuarkusTransaction.requiringNew().call(() -> {
            User a = new User();
            a.setDisplayName("Location A");
            a.setDistinctName("location_a");
            a.setEmail("loc-a@example.com");
            a.setBiography("bio a");
            a.setKeycloakId("loc-a-sub");
            em.persist(a);
            User b = new User();
            b.setDisplayName("Location B");
            b.setDistinctName("location_b");
            b.setEmail("loc-b@example.com");
            b.setKeycloakId("loc-b-sub");
            em.persist(b);
            return new Long[]{a.getId(), b.getId()};
        });
    }

    private void persistLocation(Long userId, double latitude, double longitude) {
        QuarkusTransaction.requiringNew().run(() -> {
            UserLocation location = new UserLocation();
            location.setUser(em.find(User.class, userId));
            location.setLatitude(latitude);
            location.setLongitude(longitude);
            em.persist(location);
        });
    }

    private List<UserLocation> locationsOf(Long userId) {
        return QuarkusTransaction.requiringNew().call(() -> em.createQuery(
                        "SELECT ul FROM UserLocation ul WHERE ul.user.id = :userId", UserLocation.class)
                .setParameter("userId", userId)
                .getResultList());
    }

    @AfterEach
    void removeLocationUsers() {
        QuarkusTransaction.requiringNew().run(() -> {
            em.createQuery("DELETE FROM UserLocation ul WHERE ul.user.keycloakId IN ('loc-a-sub', 'loc-b-sub')")
                    .executeUpdate();
            em.createQuery("DELETE FROM UserNotificationSettings s WHERE s.user.keycloakId IN ('loc-a-sub', 'loc-b-sub')")
                    .executeUpdate();
            em.createQuery("DELETE FROM User u WHERE u.keycloakId IN ('loc-a-sub', 'loc-b-sub')")
                    .executeUpdate();
        });
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
