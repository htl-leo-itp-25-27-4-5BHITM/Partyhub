package at.htl.notificationsettings;

import at.htl.TestBase;
import at.htl.notification.Notification;
import at.htl.notification.NotificationRepository;
import at.htl.user.User;
import io.quarkus.mailer.MockMailbox;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.function.Consumer;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class NotificationGatingTest extends TestBase {

    @Inject
    EntityManager em;

    @Inject
    NotificationRepository notifications;

    @Inject
    MockMailbox mailbox;

    Long sender;
    Long recipient;
    String recipientEmail;

    @AfterEach
    void cleanUp() {
        QuarkusTransaction.requiringNew().run(() -> at.htl.TestCleanup.removeUsers(em, java.util.List.of(sender, recipient)));
    }

    @BeforeEach
    void setUp() {
        mailbox.clear();
        long n = System.nanoTime();
        recipientEmail = "gating" + n + "@example.test";
        sender = QuarkusTransaction.requiringNew().call(() -> persist("sender_" + n, null));
        recipient = QuarkusTransaction.requiringNew().call(() -> persist("recipient_" + n, recipientEmail));
    }

    private Long persist(String handle, String email) {
        User user = new User();
        user.setDistinctName(handle);
        user.setEmail(email);
        em.persist(user);
        return user.getId();
    }

    private void settings(Consumer<UserNotificationSettings> change) {
        QuarkusTransaction.requiringNew().run(() -> {
            UserNotificationSettings settings = new UserNotificationSettings(em.find(User.class, recipient));
            change.accept(settings);
            em.persist(settings);
        });
    }

    private void deliver(NotificationCategory category) {
        QuarkusTransaction.requiringNew().run(() -> notifications.createNotification(
                new Notification(em.find(User.class, recipient), em.find(User.class, sender), null, "Gating " + category),
                category));
    }

    private long inApp() {
        return QuarkusTransaction.requiringNew().call(() -> em.createQuery(
                        "SELECT COUNT(n) FROM Notification n WHERE n.recipient.id = :id", Long.class)
                .setParameter("id", recipient).getSingleResult());
    }

    private int mails() {
        var sent = mailbox.getMailsSentTo(recipientEmail);
        return sent == null ? 0 : sent.size();
    }

    @Test
    void missingSettingsRowMeansEverythingIsDelivered() {
        deliver(NotificationCategory.PARTY_CANCELLATIONS);
        assertEquals(1, inApp());
        assertEquals(1, mails());
    }

    @Test
    void masterSwitchOffDeliversNothing() {
        settings(s -> s.setAllEnabled(false));
        for (NotificationCategory category : NotificationCategory.values()) {
            deliver(category);
        }
        assertEquals(0, inApp());
        assertEquals(0, mails());
    }

    @Test
    void eachCategoryHasItsOwnSwitch() {
        settings(s -> s.setPartyUpdates(false));
        deliver(NotificationCategory.PARTY_UPDATES);
        assertEquals(0, inApp());
        deliver(NotificationCategory.PARTY_CANCELLATIONS);
        deliver(NotificationCategory.INVITATION_RESPONSES);
        assertEquals(2, inApp());
    }

    @Test
    void channelsAreIndependent() {
        settings(s -> s.setInAppEnabled(false));
        deliver(NotificationCategory.PARTY_INVITES);
        assertEquals(0, inApp());
        assertEquals(1, mails());
    }

    @Test
    void masterSwitchKeepsIndividualValues() {
        settings(s -> s.setPartyUpdates(false));
        given().header("X-User-Id", recipient.toString()).contentType("application/json")
                .body("{\"allEnabled\":false}").when().put("/api/me/notification-settings")
                .then().statusCode(200).body("allEnabled", is(false)).body("partyUpdates", is(false)).body("unfollows", is(true));
        given().header("X-User-Id", recipient.toString()).contentType("application/json")
                .body("{\"allEnabled\":true}").when().put("/api/me/notification-settings")
                .then().statusCode(200).body("allEnabled", is(true)).body("partyUpdates", is(false))
                .body("partyCancellations", is(true)).body("followEvents", is(true));
    }

    @Test
    void legacyProfileReadsDefaultsAndMaterialisesOnUpdate() {
        given().header("X-User-Id", recipient.toString()).when().get("/api/me/notification-settings")
                .then().statusCode(200).body("allEnabled", is(true)).body("invitationResponses", is(true));
        given().header("X-User-Id", recipient.toString()).contentType("application/json")
                .body("{\"unfollows\":false}").when().put("/api/me/notification-settings")
                .then().statusCode(200).body("unfollows", is(false)).body("partyInvites", is(true));
        assertNotNull(QuarkusTransaction.requiringNew().call(() -> em.find(UserNotificationSettings.class, recipient)));
    }

    @Test
    void anonymousCallerIsRejected() {
        given().when().get("/api/me/notification-settings").then().statusCode(401);
    }
}
