package at.htl.settings;

import at.htl.TestBase;
import at.htl.user.User;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.is;

@QuarkusTest
public class UserSettingsResourceTest extends TestBase {

    @Inject
    EntityManager em;

    private Long userId;
    private Long otherId;

    @AfterEach
    void cleanUp() {
        QuarkusTransaction.requiringNew().run(() -> at.htl.TestCleanup.removeUsers(em, java.util.List.of(userId, otherId)));
    }

    @BeforeEach
    @Transactional
    void setUp() {
        em.createQuery("DELETE FROM UserSettings").executeUpdate();
        userId = persistUser("settings-a").getId();
        otherId = persistUser("settings-b").getId();
    }

    private User persistUser(String name) {
        User user = new User();
        user.setUsername(name + "-" + System.nanoTime());
        user.setDistinctName(user.getUsername());
        em.persist(user);
        return user;
    }

    @Test
    void userWithoutStoredSettingsGetsSystemTheme() {
        given().header("X-User-Id", userId.toString())
                .when().get("/api/me/settings")
                .then().statusCode(200).body("theme", is("SYSTEM"));
    }

    @Test
    void storedThemeIsReturnedAndNotSharedWithOtherUsers() {
        given().header("X-User-Id", userId.toString()).contentType("application/json")
                .body("{\"theme\":\"LIGHT\"}")
                .when().put("/api/me/settings")
                .then().statusCode(200).body("theme", is("LIGHT"));

        given().header("X-User-Id", userId.toString())
                .when().get("/api/me/settings")
                .then().statusCode(200).body("theme", is("LIGHT"));
        given().header("X-User-Id", otherId.toString())
                .when().get("/api/me/settings")
                .then().statusCode(200).body("theme", is("SYSTEM"));
    }

    @Test
    void unsupportedThemeIsRejectedAndStoredValueKept() {
        given().header("X-User-Id", userId.toString()).contentType("application/json")
                .body("{\"theme\":\"DARK\"}")
                .when().put("/api/me/settings").then().statusCode(200);

        given().header("X-User-Id", userId.toString()).contentType("application/json")
                .body("{\"theme\":\"NEON\"}")
                .when().put("/api/me/settings").then().statusCode(400);
        given().header("X-User-Id", userId.toString()).contentType("application/json")
                .body("{}")
                .when().put("/api/me/settings").then().statusCode(400);

        given().header("X-User-Id", userId.toString())
                .when().get("/api/me/settings")
                .then().statusCode(200).body("theme", is("DARK"));
    }

    @Test
    void anonymousCallerIsRejected() {
        given().when().get("/api/me/settings").then().statusCode(401);
        given().contentType("application/json").body("{\"theme\":\"DARK\"}")
                .when().put("/api/me/settings").then().statusCode(401);
    }
}
