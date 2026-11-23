package at.htl.resource;

import at.htl.TestBase;
import at.htl.user.Gender;
import at.htl.user.User;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

@QuarkusTest
class UserProfileDemographicsTest extends TestBase {
    @Inject EntityManager em;

    Long ownerId;
    Long otherId;

    @BeforeEach
    void createUsers() {
        QuarkusTransaction.requiringNew().run(() -> {
            User owner = user("demo-owner");
            owner.setGender(Gender.FEMALE);
            owner.setBirthDate(LocalDate.of(2005, 5, 17));
            ownerId = owner.getId();
            otherId = user("demo-other").getId();
        });
    }

    @AfterEach
    void cleanup() {
        QuarkusTransaction.requiringNew().run(() -> {
            em.remove(em.find(User.class, ownerId));
            em.remove(em.find(User.class, otherId));
        });
    }

    private User user(String name) {
        User user = new User();
        user.setKeycloakId(name);
        user.setDistinctName(name);
        user.setDisplayName(name);
        user.setEmail(name + "@example.com");
        em.persist(user);
        return user;
    }

    @Test
    void selfProfileContainsGenderAndBirthDate() {
        given().header("X-User-Id", ownerId.toString())
                .when().get("/api/users/" + ownerId)
                .then().statusCode(200)
                .body("gender", is("FEMALE"))
                .body("birthDate", is("2005-05-17"));
    }

    @Test
    void crossUserProfileHidesGenderAndBirthDate() {
        given().header("X-User-Id", otherId.toString())
                .when().get("/api/users/" + ownerId)
                .then().statusCode(200)
                .body("displayName", is("demo-owner"))
                .body("$", not(hasKey("gender")))
                .body("$", not(hasKey("birthDate")));
    }

    @Test
    void updateStoresGenderAndBirthDate() {
        given().header("X-User-Id", ownerId.toString()).contentType(ContentType.JSON)
                .body("{\"displayName\":\"demo-owner\",\"distinctName\":\"demo-owner\",\"email\":\"demo-owner@example.com\","
                        + "\"gender\":\"DIVERSE\",\"birthDate\":\"2000-01-02\"}")
                .when().put("/api/users/" + ownerId)
                .then().statusCode(200)
                .body("gender", is("DIVERSE"))
                .body("birthDate", is("2000-01-02"));
    }

    @Test
    void updateWithoutDemographicsClearsThem() {
        given().header("X-User-Id", ownerId.toString()).contentType(ContentType.JSON)
                .body("{\"displayName\":\"demo-owner\",\"distinctName\":\"demo-owner\",\"email\":\"demo-owner@example.com\"}")
                .when().put("/api/users/" + ownerId)
                .then().statusCode(200)
                .body("$", not(hasKey("gender")));

        User stored = QuarkusTransaction.requiringNew().call(() -> em.find(User.class, ownerId));
        assertNull(stored.getGender());
        assertNull(stored.getBirthDate());
    }

    @Test
    void futureBirthDateIsRejectedWithoutChanges() {
        String tomorrow = LocalDate.now().plusDays(1).toString();
        given().header("X-User-Id", ownerId.toString()).contentType(ContentType.JSON)
                .body("{\"displayName\":\"changed\",\"distinctName\":\"demo-owner\",\"email\":\"demo-owner@example.com\","
                        + "\"birthDate\":\"" + tomorrow + "\"}")
                .when().put("/api/users/" + ownerId)
                .then().statusCode(400);

        User stored = QuarkusTransaction.requiringNew().call(() -> em.find(User.class, ownerId));
        assertEquals("demo-owner", stored.getDisplayName());
        assertEquals(LocalDate.of(2005, 5, 17), stored.getBirthDate());
    }

    @Test
    void unknownGenderIsRejected() {
        given().header("X-User-Id", ownerId.toString()).contentType(ContentType.JSON)
                .body("{\"displayName\":\"demo-owner\",\"distinctName\":\"demo-owner\",\"gender\":\"ROBOT\"}")
                .when().put("/api/users/" + ownerId)
                .then().statusCode(400);
    }
}
