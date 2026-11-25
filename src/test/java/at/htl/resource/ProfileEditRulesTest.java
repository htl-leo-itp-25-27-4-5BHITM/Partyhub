package at.htl.resource;

import at.htl.TestBase;
import at.htl.profile_picture.ProfilePicture;
import at.htl.user.User;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

@QuarkusTest
public class ProfileEditRulesTest extends TestBase {

    @Inject
    EntityManager em;

    Long userId;
    Long otherId;
    String otherHandle;

    @BeforeEach
    void createUsers() {
        QuarkusTransaction.requiringNew().run(() -> {
            long n = System.nanoTime();
            User user = new User();
            user.setDistinctName("old_style-handle " + n);
            user.setDisplayName("Editor");
            user.setEmail("editor" + n + "@example.test");
            em.persist(user);
            userId = user.getId();

            User other = new User();
            otherHandle = "taken_" + n;
            other.setDistinctName(otherHandle);
            em.persist(other);
            otherId = other.getId();
        });
    }

    @AfterEach
    void removeUsers() {
        QuarkusTransaction.requiringNew().run(() -> {
            for (Long id : new Long[]{userId, otherId}) {
                User user = em.find(User.class, id);
                if (user != null) {
                    em.remove(user);
                }
            }
        });
    }

    private String body(String handle, String email) {
        return """
            {"displayName":"Editor","distinctName":"%s","email":"%s","phoneNumber":null,"biography":"Hi"}
            """.formatted(handle, email);
    }

    private User reload(Long id) {
        return QuarkusTransaction.requiringNew().call(() -> em.find(User.class, id));
    }

    @Test
    void profileUpdateIgnoresEmail() {
        String before = reload(userId).getEmail();
        given().header("X-User-Id", userId.toString()).contentType("application/json")
                .body(body(reload(userId).getDistinctName(), "attacker@example.test"))
                .when().put("/api/users/{id}", userId)
                .then().statusCode(200).body("email", is(before));
        assertEquals(before, reload(userId).getEmail());
    }

    @Test
    void unchangedOlderHandleStaysValid() {
        given().header("X-User-Id", userId.toString()).contentType("application/json")
                .body(body(reload(userId).getDistinctName(), "x@example.test"))
                .when().put("/api/users/{id}", userId)
                .then().statusCode(200);
    }

    @Test
    void changedHandleMustFollowTheRules() {
        for (String bad : new String[]{"ab", "with space", "a".repeat(31), "bad-dash"}) {
            given().header("X-User-Id", userId.toString()).contentType("application/json")
                    .body(body(bad, "x@example.test"))
                    .when().put("/api/users/{id}", userId)
                    .then().statusCode(400).body("field", is("distinctName"));
        }
        given().header("X-User-Id", userId.toString()).contentType("application/json")
                .body(body("new.handle_" + (System.nanoTime() % 100000), "x@example.test"))
                .when().put("/api/users/{id}", userId)
                .then().statusCode(200);
    }

    @Test
    void takenHandleIsRejectedAndOldHandleKept() {
        String before = reload(userId).getDistinctName();
        given().header("X-User-Id", userId.toString()).contentType("application/json")
                .body(body(otherHandle.toUpperCase(), "x@example.test"))
                .when().put("/api/users/{id}", userId)
                .then().statusCode(409).body("field", is("distinctName"));
        assertEquals(before, reload(userId).getDistinctName());
    }

    @Test
    void ownerRemovesPictureButNotSomeoneElses() {
        QuarkusTransaction.requiringNew().run(() -> {
            for (Long id : new Long[]{userId, otherId}) {
                User user = em.find(User.class, id);
                ProfilePicture picture = new ProfilePicture("missing-" + id + ".png", user);
                em.persist(picture);
                user.setProfilePicture(picture);
            }
        });

        given().header("X-User-Id", userId.toString())
                .when().delete("/api/users/{id}/profile-picture", otherId)
                .then().statusCode(403);
        given().header("X-User-Id", userId.toString())
                .when().delete("/api/users/{id}/profile-picture", userId)
                .then().statusCode(204);

        given().header("X-User-Id", userId.toString())
                .when().get("/api/users/{id}/profile-picture-filename", userId)
                .then().statusCode(200).body("filename", is((Object) null));
        given().header("X-User-Id", userId.toString())
                .when().get("/api/users/{id}/profile-picture-filename", otherId)
                .then().statusCode(200).body("filename", is("missing-" + otherId + ".png"));
        assertNull(reload(userId).getProfilePicture());
    }
}
