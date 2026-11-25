package at.htl.resource;

import at.htl.TestBase;
import at.htl.user.User;
import at.htl.notificationsettings.UserNotificationSettings;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
@TestSecurity(user="input-safety-owner")
class InputSafetyResourceTest extends TestBase {
    @Inject EntityManager em;
    Long owner;
    final String party = "{\"title\":\"Reunion & Friends\",\"time_start\":\"2027-01-20T18:00:00\",\"latitude\":48.3,\"longitude\":14.3,\"visibility\":\"PUBLIC\"}";

    @BeforeEach
    void setupOwner() {
        owner = QuarkusTransaction.requiringNew().call(() -> {
            var users = em.createQuery("select u from User u where u.keycloakId = :sub", User.class)
                    .setParameter("sub", "input-safety-owner").getResultList();
            if (!users.isEmpty()) return users.getFirst().getId();
            User user = new User(); user.setKeycloakId("input-safety-owner");
            user.setDisplayName("Input safety owner"); user.setDistinctName("input_safety_owner");
            em.persist(user); em.persist(new UserNotificationSettings(user)); em.flush();
            return user.getId();
        });
    }

    long count(String entity) {
        return QuarkusTransaction.requiringNew().call(() -> em.createQuery("select count(e) from " + entity + " e", Long.class).getSingleResult());
    }

    void invalidParty(String json) {
        long before = count("Party"), notifications = count("Notification");
        given().contentType("application/json").body(json).post("/api/parties")
                .then().statusCode(400).contentType("application/json").body("error", equalTo("invalid_input"));
        assertEquals(before, count("Party")); assertEquals(notifications, count("Notification"));
    }

    @Test void rejectsUnsafeAndMissingPartyFieldsBeforePersistence() {
        invalidParty(party.replace("\"time_start\":\"2027-01-20T18:00:00\",", ""));
        invalidParty(party.replace("\"PUBLIC\"", "\"OTHER\""));
        invalidParty(party.replace("48.3", "91"));
        invalidParty(party.replace("\"longitude\":14.3,", ""));
        invalidParty(party.replace("\"visibility\"", "\"website\":\"javascript:alert(1)\",\"visibility\""));
        invalidParty(party.replace("\"visibility\"", "\"selectedUsers\":[null],\"visibility\""));
        invalidParty("null");
    }

    @Test void rejectsCoercedScalarsAndMalformedJsonWithoutLeakingPayloads() {
        invalidParty(party.replace("\"visibility\"", "\"max_people\":1.5,\"visibility\""));
        invalidParty(party.replace("\"visibility\"", "\"max_people\":\"20\",\"visibility\""));
        given().contentType("application/json").body("{\"displayName\":123}").post("/api/users")
                .then().statusCode(400).body(not(containsString("123")));
        given().contentType("application/json").body("{\"secret-rejected-value\":").post("/api/users")
                .then().statusCode(400).body(not(containsString("secret-rejected-value")));
    }

    @Test void validatesProfileWhileKeepingPlainTextAndUnicode() {
        long before = count("User");
        given().contentType("application/json").body(Map.of("email", "bad-email")).post("/api/users").then().statusCode(400);
        given().contentType("application/json").body(Map.of("biography", "x".repeat(2001))).post("/api/users").then().statusCode(400);
        given().contentType("application/json").body(Map.of("displayName", "line\nspoof")).post("/api/users").then().statusCode(400);
        assertEquals(before, count("User"));
        String text = "Özlem 李 🎉 O'Brien <img src=x>";
        given().contentType("application/json").body(Map.of("displayName", text, "biography", "First line\nSecond\tline"))
                .put("/api/users/" + owner).then().statusCode(200).body("displayName", equalTo(text));
    }

    @Test void nullBodiesAndCoercedSettingsFail() {
        for (String path : new String[]{"/api/users/" + owner, "/api/users/" + owner + "/notification-settings"}) {
            given().contentType("application/json").body("null").put(path).then().statusCode(400);
        }
        for (String bad : new String[]{"\"true\"", "1", "null"}) {
            given().contentType("application/json").body("{\"emailEnabled\":" + bad + "}")
                    .put("/api/users/" + owner + "/notification-settings").then().statusCode(400);
        }
        given().contentType("application/json").body("null").post("/api/qr/exchange").then().statusCode(400);
    }

    @Test void boundedSearchAndJsonBudgetsApply() {
        for (String query : new String[]{"limit=101", "offset=-1", "user_latitude=NaN&user_longitude=14", "sort=evil", "q=" + "x".repeat(201)})
            given().get("/api/parties?" + query).then().statusCode(400);
        given().contentType("application/json").body("{\"biography\":\"" + "x".repeat(262144) + "\"}")
                .post("/api/users").then().statusCode(413);
        given().contentType("application/json").body("{\"unknown\":" + "[".repeat(40) + "0" + "]".repeat(40) + "}")
                .post("/api/users").then().statusCode(400);
    }
}
