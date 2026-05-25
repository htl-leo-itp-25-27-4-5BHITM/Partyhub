package at.htl.auth;

import at.htl.user.User;
import at.htl.user.UserRepository;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
@Transactional
class CurrentUserResolverTest {

    @Inject
    CurrentUserResolver currentUserResolver;

    @Inject
    UserRepository userRepository;

    @Inject
    EntityManager entityManager;

    @BeforeEach
    void setUp() {
        entityManager.createQuery("DELETE FROM UserLocation").executeUpdate();
        entityManager.createQuery("DELETE FROM Notification").executeUpdate();
        entityManager.createQuery("DELETE FROM Follow").executeUpdate();
        entityManager.createQuery("DELETE FROM Invitation").executeUpdate();
        entityManager.createQuery("DELETE FROM Media").executeUpdate();
        entityManager.createQuery("DELETE FROM Party").executeUpdate();
        entityManager.createQuery("DELETE FROM ProfilePicture").executeUpdate();
        entityManager.createQuery("DELETE FROM UserNotificationSettings").executeUpdate();
        entityManager.createQuery("DELETE FROM User").executeUpdate();
        entityManager.flush();
    }

    @Test
    @TestSecurity(user = "linked-sub")
    void resolvesLinkedUserBySubject() {
        User user = new User();
        user.setUsername("linked_user");
        user.setDistinctName("linked_user");
        user.setDisplayName("Linked User");
        user.setEmail("linked@example.com");
        user.setKeycloakId("linked-sub");
        entityManager.persist(user);
        entityManager.flush();

        User resolved = currentUserResolver.requireCurrentUser();

        assertEquals(user.getId(), resolved.getId());
        assertEquals("linked-sub", resolved.getKeycloakId());
    }

    @Test
    @TestSecurity(user = "viki_dji")
    void linksExistingUnlinkedUserOnFirstLogin() {
        User user = new User();
        user.setUsername("viki_dji");
        user.setDistinctName("viki_vejmelek");
        user.setDisplayName("Victoria Vejmelek");
        user.setEmail("v.vejmelek@students.htl-leonding.ac.at");
        entityManager.persist(user);
        entityManager.flush();

        User resolved = currentUserResolver.requireCurrentUser();

        assertEquals(user.getId(), resolved.getId());
        assertEquals("viki_dji", resolved.getKeycloakId());
    }

    @Test
    @TestSecurity(user = "unmatched-sub")
    void createsMinimalUserForUnmatchedAuthenticatedSubject() {
        User resolved = currentUserResolver.requireCurrentUser();

        assertNotNull(resolved.getId());
        assertEquals("unmatched-sub", resolved.getKeycloakId());
        assertTrue(userRepository.findByKeycloakId("unmatched-sub").isPresent());
    }
}
