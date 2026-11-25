package at.htl.security;

import at.htl.TestBase;
import at.htl.notificationsettings.UserNotificationSettings;
import at.htl.user.User;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.MockMailbox;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

@QuarkusTest
public class EmailChangeFlowTest extends TestBase {

    private static final Pattern CONFIRM = Pattern.compile("#token=([A-Za-z0-9_-]+)");
    private static final Pattern CANCEL = Pattern.compile("#cancel=([A-Za-z0-9_-]+)");

    @Inject
    EntityManager em;

    @Inject
    MockMailbox mailbox;

    KeycloakAccountService keycloak;
    final java.util.List<Long> created = new java.util.ArrayList<>();
    Long userId;
    String oldEmail;
    String newEmail;

    @BeforeEach
    void setUp() {
        keycloak = Mockito.mock(KeycloakAccountService.class);
        Mockito.when(keycloak.passwordResetUrl()).thenReturn("http://kc.test/reset");
        QuarkusMock.installMockForType(keycloak, KeycloakAccountService.class);
        mailbox.clear();
        long n = System.nanoTime();
        oldEmail = "old" + n + "@example.test";
        newEmail = "new" + n + "@example.test";
        QuarkusTransaction.requiringNew().run(() -> {
            User user = new User();
            user.setDistinctName("mail_user_" + n);
            user.setDisplayName("Mail User");
            user.setEmail(oldEmail);
            user.setKeycloakId("kc-" + n);
            em.persist(user);
            userId = user.getId();
        });
        created.add(userId);
    }

    @AfterEach
    void cleanUp() {
        QuarkusTransaction.requiringNew().run(() -> at.htl.TestCleanup.removeUsers(em, created));
        created.clear();
    }

    private io.restassured.response.Response requestChange(String email) {
        return given().header("X-User-Id", userId.toString()).header("User-Agent",
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15")
                .contentType("application/json").body("{\"newEmail\":\"" + email + "\"}")
                .when().post("/api/me/email-change");
    }

    private List<Mail> awaitMails(String to, int count) {
        for (int i = 0; i < 100; i++) {
            List<Mail> mails = mailbox.getMailsSentTo(to);
            if (mails != null && mails.size() >= count) {
                return mails;
            }
            try {
                Thread.sleep(50);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        fail("Expected " + count + " mail(s) to " + to + " but got " + mailbox.getMailsSentTo(to));
        return List.of();
    }

    private static String token(Pattern pattern, Mail mail) {
        Matcher matcher = pattern.matcher(mail.getText());
        assertTrue(matcher.find(), "link missing in " + mail.getSubject());
        return matcher.group(1);
    }

    private int confirm(String token) {
        return given().contentType("application/json").body("{\"token\":\"" + token + "\"}")
                .when().post("/api/email-change/confirm").then().extract().statusCode();
    }

    private User reload() {
        return QuarkusTransaction.requiringNew().call(() -> em.find(User.class, userId));
    }

    @Test
    void requestSendsLinkToNewAddressAndNoticeToOldAddress() {
        requestChange(newEmail).then().statusCode(201).body("pending", is(true)).body("newEmail", is(newEmail));

        Mail confirmation = awaitMails(newEmail, 1).get(0);
        Mail notice = awaitMails(oldEmail, 1).get(0);
        assertEquals(1, mailbox.getMailsSentTo(newEmail).size());
        assertEquals(1, mailbox.getMailsSentTo(oldEmail).size());
        assertTrue(CONFIRM.matcher(confirmation.getText()).find());
        assertFalse(CANCEL.matcher(confirmation.getText()).find());
        assertTrue(CANCEL.matcher(notice.getText()).find());
        assertFalse(CONFIRM.matcher(notice.getText()).find());
        assertTrue(notice.getText().contains(SecurityTokens.maskEmail(newEmail)));
        assertFalse(notice.getText().contains(newEmail));
        assertTrue(notice.getText().contains("Safari on macOS"));
        assertNotNull(confirmation.getHtml());

        given().header("X-User-Id", userId.toString()).when().get("/api/me/email-change")
                .then().statusCode(200).body("pending", is(true)).body("newEmail", is(newEmail));
        assertEquals(oldEmail, reload().getEmail());
    }

    @Test
    void storedDataContainsOnlyTokenHashes() {
        requestChange(newEmail).then().statusCode(201);
        String token = token(CONFIRM, awaitMails(newEmail, 1).get(0));
        EmailChangeRequest stored = QuarkusTransaction.requiringNew().call(() ->
                em.createQuery("SELECT r FROM EmailChangeRequest r WHERE r.user.id = :id", EmailChangeRequest.class)
                        .setParameter("id", userId).getSingleResult());
        assertNotEquals(token, stored.getConfirmTokenHash());
        assertEquals(SecurityTokens.hash(token), stored.getConfirmTokenHash());
    }

    @Test
    void confirmingActivatesNewAddressAndNotifiesBoth() {
        requestChange(newEmail).then().statusCode(201);
        String token = token(CONFIRM, awaitMails(newEmail, 1).get(0));
        awaitMails(oldEmail, 1);

        assertEquals(204, confirm(token));
        Mockito.verify(keycloak).updateEmail(eq(reload().getKeycloakId()), eq(newEmail));
        assertEquals(newEmail, reload().getEmail());
        assertNotNull(reload().getEmailChangedAt());

        Mail done = awaitMails(newEmail, 2).get(1);
        Mail info = awaitMails(oldEmail, 2).get(1);
        assertTrue(done.getSubject().contains("was changed"));
        assertTrue(info.getSubject().contains("e-mail of your account was changed"));
        assertTrue(info.getText().contains("http://kc.test/reset"));

        assertEquals(410, confirm(token));
        given().header("X-User-Id", userId.toString()).when().get("/api/me/email-change")
                .then().statusCode(200).body("pending", is(false));
    }

    @Test
    void newRequestReplacesOldOneAndOldLinkStopsWorking() {
        requestChange(newEmail).then().statusCode(201);
        String first = token(CONFIRM, awaitMails(newEmail, 1).get(0));
        String second = "second" + newEmail;
        requestChange(second).then().statusCode(201);
        String secondToken = token(CONFIRM, awaitMails(second, 1).get(0));

        given().contentType("application/json").body("{\"token\":\"" + first + "\"}")
                .when().post("/api/email-change/confirm")
                .then().statusCode(410).body("code", is("LINK_INVALID"));
        assertEquals(204, confirm(secondToken));
        assertEquals(second, reload().getEmail());
    }

    @Test
    void resendInvalidatesThePreviousLink() {
        requestChange(newEmail).then().statusCode(201);
        String first = token(CONFIRM, awaitMails(newEmail, 1).get(0));
        given().header("X-User-Id", userId.toString()).when().post("/api/me/email-change/resend")
                .then().statusCode(200).body("pending", is(true));
        String second = token(CONFIRM, awaitMails(newEmail, 2).get(1));

        assertEquals(410, confirm(first));
        assertEquals(204, confirm(second));
    }

    @Test
    void cancelEndsThePendingChange() {
        requestChange(newEmail).then().statusCode(201);
        String token = token(CONFIRM, awaitMails(newEmail, 1).get(0));
        given().header("X-User-Id", userId.toString()).when().delete("/api/me/email-change").then().statusCode(204);

        assertEquals(410, confirm(token));
        assertEquals(oldEmail, reload().getEmail());
    }

    @Test
    void notMeCancelsTheChangeAndLeadsToPasswordReset() {
        requestChange(newEmail).then().statusCode(201);
        String confirmToken = token(CONFIRM, awaitMails(newEmail, 1).get(0));
        String cancelToken = token(CANCEL, awaitMails(oldEmail, 1).get(0));

        given().contentType("application/json").body("{\"token\":\"" + cancelToken + "\"}")
                .when().post("/api/email-change/not-me")
                .then().statusCode(200).body("passwordResetUrl", startsWith("http://kc.test/reset"));
        assertEquals(410, confirm(confirmToken));
        given().contentType("application/json").body("{\"token\":\"" + cancelToken + "\"}")
                .when().post("/api/email-change/not-me").then().statusCode(410);
        assertEquals(oldEmail, reload().getEmail());
    }

    @Test
    void expiredLinkIsRejected() {
        requestChange(newEmail).then().statusCode(201);
        String token = token(CONFIRM, awaitMails(newEmail, 1).get(0));
        QuarkusTransaction.requiringNew().run(() ->
                em.createQuery("UPDATE EmailChangeRequest r SET r.expiresAt = :past WHERE r.user.id = :id")
                        .setParameter("past", OffsetDateTime.now().minusMinutes(1))
                        .setParameter("id", userId).executeUpdate());

        given().contentType("application/json").body("{\"token\":\"" + token + "\"}")
                .when().post("/api/email-change/confirm")
                .then().statusCode(410).body("code", is("LINK_EXPIRED"));
        assertEquals(oldEmail, reload().getEmail());
    }

    @Test
    void keycloakFailureKeepsOldAddressAndPendingChange() {
        requestChange(newEmail).then().statusCode(201);
        String token = token(CONFIRM, awaitMails(newEmail, 1).get(0));
        Mockito.doThrow(new KeycloakAccountService.KeycloakUnavailableException("down"))
                .when(keycloak).updateEmail(anyString(), anyString());

        assertEquals(503, confirm(token));
        assertEquals(oldEmail, reload().getEmail());
        given().header("X-User-Id", userId.toString()).when().get("/api/me/email-change")
                .then().statusCode(200).body("pending", is(true));
    }

    @Test
    void addressTakenMeanwhileIsNotApplied() {
        requestChange(newEmail).then().statusCode(201);
        String token = token(CONFIRM, awaitMails(newEmail, 1).get(0));
        Mockito.when(keycloak.emailUsedByOtherAccount(eq(newEmail), anyString())).thenReturn(true);

        assertEquals(409, confirm(token));
        assertEquals(oldEmail, reload().getEmail());
    }

    @Test
    void invalidSameOrTakenAddressesAreRejectedAtTheField() {
        requestChange("not-an-email").then().statusCode(400);
        requestChange(oldEmail.toUpperCase()).then().statusCode(400).body("code", is("SAME_EMAIL")).body("field", is("newEmail"));

        String takenLocally = "local" + newEmail;
        QuarkusTransaction.requiringNew().run(() -> {
            User other = new User();
            other.setDistinctName("other_" + System.nanoTime());
            other.setEmail(takenLocally);
            em.persist(other);
            created.add(other.getId());
        });
        requestChange(takenLocally.toUpperCase()).then().statusCode(409).body("code", is("EMAIL_TAKEN"));

        Mockito.when(keycloak.emailUsedByOtherAccount(eq(newEmail), anyString())).thenReturn(true);
        requestChange(newEmail).then().statusCode(409).body("field", is("newEmail"));
        assertTrue(mailbox.getMailsSentTo(newEmail) == null || mailbox.getMailsSentTo(newEmail).isEmpty());
    }

    @Test
    void sixthRequestWithinAnHourIsRateLimited() {
        for (int i = 0; i < 5; i++) {
            requestChange(i + newEmail).then().statusCode(201);
        }
        requestChange("6" + newEmail).then().statusCode(429).body("code", is("RATE_LIMITED"));
        given().header("X-User-Id", userId.toString()).when().post("/api/me/email-change/resend")
                .then().statusCode(429);
        assertTrue(mailbox.getMailsSentTo("6" + newEmail) == null || mailbox.getMailsSentTo("6" + newEmail).isEmpty());
    }

    @Test
    void securityMailsIgnoreDisabledNotifications() {
        QuarkusTransaction.requiringNew().run(() -> {
            UserNotificationSettings settings = new UserNotificationSettings(em.find(User.class, userId));
            settings.setAllEnabled(false);
            settings.setEmailEnabled(false);
            settings.setInAppEnabled(false);
            em.persist(settings);
        });
        requestChange(newEmail).then().statusCode(201);
        awaitMails(newEmail, 1);
        awaitMails(oldEmail, 1);
    }

    @Test
    void anonymousCallerCannotStartAChange() {
        given().contentType("application/json").body("{\"newEmail\":\"x@example.test\"}")
                .when().post("/api/me/email-change").then().statusCode(401);
        given().when().get("/api/me/email-change").then().statusCode(401);
    }
}
