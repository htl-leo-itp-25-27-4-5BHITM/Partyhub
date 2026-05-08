package at.htl.repository;

import at.htl.qr.QrLogin;
import at.htl.qr.QrLoginRepository;
import at.htl.user.User;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
@Transactional
public class QrLoginRepositoryTest {

    @Inject
    QrLoginRepository qrLoginRepository;

    @Inject
    EntityManager entityManager;

    @BeforeEach
    void setUp() {
        entityManager.createQuery("DELETE FROM UserLocation").executeUpdate();
        entityManager.createQuery("DELETE FROM Notification").executeUpdate();
        entityManager.createQuery("DELETE FROM Media").executeUpdate();
        entityManager.createQuery("DELETE FROM ProfilePicture").executeUpdate();
        entityManager.createQuery("DELETE FROM Invitation").executeUpdate();
        entityManager.createQuery("DELETE FROM QrLogin").executeUpdate();
        entityManager.createQuery("DELETE FROM Party").executeUpdate();
        entityManager.createQuery("DELETE FROM User").executeUpdate();
        entityManager.flush();
    }

    private Long createTestUser() {
        User user = new User();
        user.setDisplayName("Test User");
        user.setDistinctName("testuser");
        user.setEmail("test@example.com");
        entityManager.persist(user);
        entityManager.flush();
        return user.getId();
    }

    @Test
    void testFindByToken_found() {
        Long userId = createTestUser();
        QrLogin qrLogin = new QrLogin();
        qrLogin.setToken("valid-token");
        qrLogin.setExpiresAt(Instant.now().plus(5, java.time.temporal.ChronoUnit.MINUTES));
        qrLogin.setMobileToken("mobile-token-1");
        qrLogin.setUserId(userId);
        entityManager.persist(qrLogin);
        entityManager.flush();

        Optional<QrLogin> found = qrLoginRepository.findByToken("valid-token");
        assertTrue(found.isPresent());
        assertEquals("valid-token", found.get().getToken());
    }

    @Test
    void testFindByToken_notFound() {
        Optional<QrLogin> found = qrLoginRepository.findByToken("nonexistent");
        assertTrue(found.isEmpty());
    }

    @Test
    void testFindByToken_null() {
        Optional<QrLogin> found = qrLoginRepository.findByToken(null);
        assertTrue(found.isEmpty());
    }

    @Test
    void testFindByMobileToken_found() {
        Long userId = createTestUser();
        QrLogin qrLogin = new QrLogin();
        qrLogin.setToken("token-1");
        qrLogin.setMobileToken("mobile-token-1");
        qrLogin.setExpiresAt(Instant.now().plus(5, java.time.temporal.ChronoUnit.MINUTES));
        qrLogin.setUserId(userId);
        entityManager.persist(qrLogin);
        entityManager.flush();

        Optional<QrLogin> found = qrLoginRepository.findByMobileToken("mobile-token-1");
        assertTrue(found.isPresent());
        assertEquals("mobile-token-1", found.get().getMobileToken());
    }

    @Test
    void testFindByMobileToken_notFound() {
        Optional<QrLogin> found = qrLoginRepository.findByMobileToken("nonexistent");
        assertTrue(found.isEmpty());
    }

    @Test
    void testFindByMobileToken_null() {
        Optional<QrLogin> found = qrLoginRepository.findByMobileToken(null);
        assertTrue(found.isEmpty());
    }

    @Test
    void testPersist() {
        Long userId = createTestUser();
        QrLogin qrLogin = new QrLogin();
        qrLogin.setToken("new-token");
        qrLogin.setMobileToken("new-mobile-token");
        qrLogin.setExpiresAt(Instant.now().plus(5, java.time.temporal.ChronoUnit.MINUTES));
        qrLogin.setUserId(userId);

        qrLoginRepository.persist(qrLogin);
        entityManager.flush();

        assertNotNull(qrLogin.getId());
        assertTrue(qrLogin.getId() > 0);
    }

    @Test
    void testPersist_multiple() {
        Long userId = createTestUser();
        QrLogin qr1 = new QrLogin();
        qr1.setToken("token-1");
        qr1.setMobileToken("mobile-1");
        qr1.setExpiresAt(Instant.now().plus(5, java.time.temporal.ChronoUnit.MINUTES));
        qr1.setUserId(userId);

        QrLogin qr2 = new QrLogin();
        qr2.setToken("token-2");
        qr2.setMobileToken("mobile-2");
        qr2.setExpiresAt(Instant.now().plus(5, java.time.temporal.ChronoUnit.MINUTES));
        qr2.setUserId(userId);

        qrLoginRepository.persist(qr1);
        qrLoginRepository.persist(qr2);
        entityManager.flush();

        assertEquals(2L, entityManager.createQuery("SELECT COUNT(q) FROM QrLogin q").getSingleResult());
    }
}
