package at.htl.notification;

import at.htl.TestBase;
import at.htl.notificationsettings.UserNotificationSettings;
import at.htl.notificationsettings.UserNotificationSettingsRepository;
import at.htl.user.User;
import at.htl.user.UserRepository;
import io.quarkus.mailer.MockMailbox;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class PartyEmailDigestServiceTest extends TestBase {

    @Inject
    PartyEmailDigestService digestService;

    @Inject
    MockMailbox mailbox;

    @Inject
    UserRepository userRepository;

    @Inject
    UserNotificationSettingsRepository settingsRepository;

    @Inject
    EntityManager em;

    @Test
    @Transactional
    void testDigestRespectsDisabledEmail() {
        User user = new User();
        user.setUsername("digest-test-noemail");
        user.setDistinctName("digest-test-noemail");
        user.setEmail("digest-noemail@test.com");
        userRepository.persist(user);
        em.flush();

        UserNotificationSettings settings = new UserNotificationSettings(user);
        settings.setEmailEnabled(false);
        settingsRepository.persist(settings);
        em.flush();

        mailbox.clear();
        digestService.sendWeeklyDigest();

        assertTrue(mailbox.getMessagesSentTo("digest-noemail@test.com").isEmpty());
    }

    @Test
    @Transactional
    void testDigestRespectsDisabledPartyUpdates() {
        User user = new User();
        user.setUsername("digest-test-noupdates");
        user.setDistinctName("digest-test-noupdates");
        user.setEmail("digest-noupdates@test.com");
        userRepository.persist(user);
        em.flush();

        UserNotificationSettings settings = new UserNotificationSettings(user);
        settings.setEmailEnabled(true);
        settings.setPartyUpdates(false);
        settingsRepository.persist(settings);
        em.flush();

        mailbox.clear();
        digestService.sendWeeklyDigest();

        assertTrue(mailbox.getMessagesSentTo("digest-noupdates@test.com").isEmpty());
    }
}
