package at.htl.notificationsettings;

import at.htl.TestBase;
import at.htl.user.User;
import at.htl.user.UserRepository;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class UserNotificationSettingsResourceTest extends TestBase {

    @Inject
    UserRepository userRepository;

    @Inject
    EntityManager em;

    private Long userId;

    @BeforeEach
    @Transactional
    void setUp() {
        em.createQuery("DELETE FROM UserNotificationSettings").executeUpdate();
        em.createQuery("DELETE FROM User").executeUpdate();
        em.flush();
        User user = new User();
        user.setUsername("settings-test-user-" + System.nanoTime());
        user.setDistinctName("settings-test-user");
        user.setEmail("settings@test.com");
        userRepository.persist(user);
        em.flush();
        userId = user.getId();

        UserNotificationSettings settings = new UserNotificationSettings(user);
        em.persist(settings);
        em.flush();
    }

    @Test
    void testGetSettings() {
        given()
            .header("X-User-Id", userId.toString())
            .when().get("/api/users/" + userId + "/notification-settings")
            .then()
            .statusCode(200)
            .body("emailEnabled", is(true))
            .body("inAppEnabled", is(true))
            .body("partyInvites", is(true));
    }

    @Test
    void testUpdateSettings() {
        given()
            .header("X-User-Id", userId.toString())
            .contentType("application/json")
            .body("""
                {
                    "emailEnabled": false,
                    "pushEnabled": true,
                    "smsEnabled": false,
                    "inAppEnabled": true,
                    "partyInvites": false,
                    "partyUpdates": true,
                    "followEvents": false
                }
                """)
            .when().put("/api/users/" + userId + "/notification-settings")
            .then()
            .statusCode(200)
            .body("emailEnabled", is(false))
            .body("partyInvites", is(false));
    }

    @Test
    void testGetSettings_otherUser_forbidden() {
        long otherId = userId + 9999;
        given()
            .header("X-User-Id", userId.toString())
            .when().get("/api/users/" + otherId + "/notification-settings")
            .then()
            .statusCode(403);
    }

    @Test
    void testGetSettings_noAuth() {
        given()
            .when().get("/api/users/" + userId + "/notification-settings")
            .then()
            .statusCode(401);
    }
}
