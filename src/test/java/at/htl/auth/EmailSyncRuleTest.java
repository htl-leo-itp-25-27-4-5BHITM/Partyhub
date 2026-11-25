package at.htl.auth;

import at.htl.user.User;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EmailSyncRuleTest {

    private User user(String email, OffsetDateTime changedAt) {
        User user = new User();
        user.setEmail(email);
        user.setEmailChangedAt(changedAt);
        return user;
    }

    @Test
    void adminChangeInKeycloakIsTakenOver() {
        long now = OffsetDateTime.now().toEpochSecond();
        assertTrue(CurrentUserResolver.shouldTakeTokenEmail(user("old@x.test", null), "admin-set@x.test", now));
    }

    @Test
    void sameAddressInOtherCaseIsIgnored() {
        long now = OffsetDateTime.now().toEpochSecond();
        assertFalse(CurrentUserResolver.shouldTakeTokenEmail(user("Me@X.test", null), "me@x.test", now));
    }

    @Test
    void tokenFromBeforeAConfirmedChangeDoesNotRevertIt() {
        OffsetDateTime changedAt = OffsetDateTime.now();
        long issuedBefore = changedAt.minusMinutes(3).toEpochSecond();
        assertFalse(CurrentUserResolver.shouldTakeTokenEmail(user("new@x.test", changedAt), "old@x.test", issuedBefore));
    }

    @Test
    void tokenIssuedAfterTheChangeIsTakenOver() {
        OffsetDateTime changedAt = OffsetDateTime.now().minusDays(1);
        long issuedAfter = OffsetDateTime.now().toEpochSecond();
        assertTrue(CurrentUserResolver.shouldTakeTokenEmail(user("new@x.test", changedAt), "later@x.test", issuedAfter));
    }

    @Test
    void missingClaimsChangeNothing() {
        assertFalse(CurrentUserResolver.shouldTakeTokenEmail(user("me@x.test", null), null, 100));
        assertFalse(CurrentUserResolver.shouldTakeTokenEmail(user("me@x.test", null), "other@x.test", 0));
    }
}
