package at.htl.qr;

import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class QrServiceTest {

    @Test
    void testGenerateForUser() {
        QrLoginRepository mockRepo = mock(QrLoginRepository.class);
        QrService service = new QrService();
        service.qrRepo = mockRepo;

        QrLogin result = service.generateForUser(1L);

        assertNotNull(result);
        assertEquals(1L, result.getUserId());
        assertNotNull(result.getToken());
        assertFalse(result.isUsed());
        assertTrue(result.getExpiresAt().isAfter(Instant.now()));
        verify(mockRepo).persist(result);
    }

    @Test
    void testGenerateForUser_persistFails() {
        QrLoginRepository mockRepo = mock(QrLoginRepository.class);
        QrService service = new QrService();
        service.qrRepo = mockRepo;

        doThrow(new RuntimeException("DB error")).when(mockRepo).persist(any());

        assertThrows(RuntimeException.class, () -> service.generateForUser(1L));
    }

    @Test
    void testFindValidByToken_valid() {
        QrLoginRepository mockRepo = mock(QrLoginRepository.class);
        QrService service = new QrService();
        service.qrRepo = mockRepo;

        QrLogin qrLogin = new QrLogin();
        qrLogin.setToken("valid-token");
        qrLogin.setUsed(false);
        qrLogin.setExpiresAt(Instant.now().plus(5, java.time.temporal.ChronoUnit.MINUTES));

        when(mockRepo.findByToken("valid-token")).thenReturn(Optional.of(qrLogin));

        Optional<QrLogin> result = service.findValidByToken("valid-token");
        assertTrue(result.isPresent());
        assertEquals("valid-token", result.get().getToken());
    }

    @Test
    void testFindValidByToken_notFound() {
        QrLoginRepository mockRepo = mock(QrLoginRepository.class);
        QrService service = new QrService();
        service.qrRepo = mockRepo;

        when(mockRepo.findByToken("invalid")).thenReturn(Optional.empty());

        Optional<QrLogin> result = service.findValidByToken("invalid");
        assertTrue(result.isEmpty());
    }

    @Test
    void testFindValidByToken_used() {
        QrLoginRepository mockRepo = mock(QrLoginRepository.class);
        QrService service = new QrService();
        service.qrRepo = mockRepo;

        QrLogin qrLogin = new QrLogin();
        qrLogin.setToken("used-token");
        qrLogin.setUsed(true);
        qrLogin.setExpiresAt(Instant.now().plus(5, java.time.temporal.ChronoUnit.MINUTES));

        when(mockRepo.findByToken("used-token")).thenReturn(Optional.of(qrLogin));

        Optional<QrLogin> result = service.findValidByToken("used-token");
        assertTrue(result.isEmpty());
    }

    @Test
    void testFindValidByToken_expired() {
        QrLoginRepository mockRepo = mock(QrLoginRepository.class);
        QrService service = new QrService();
        service.qrRepo = mockRepo;

        QrLogin qrLogin = new QrLogin();
        qrLogin.setToken("expired-token");
        qrLogin.setUsed(false);
        qrLogin.setExpiresAt(Instant.now().minus(5, java.time.temporal.ChronoUnit.MINUTES));

        when(mockRepo.findByToken("expired-token")).thenReturn(Optional.of(qrLogin));

        Optional<QrLogin> result = service.findValidByToken("expired-token");
        assertTrue(result.isEmpty());
    }

    @Test
    void testFindByToken() {
        QrLoginRepository mockRepo = mock(QrLoginRepository.class);
        QrService service = new QrService();
        service.qrRepo = mockRepo;

        QrLogin qrLogin = new QrLogin();
        qrLogin.setToken("test-token");

        when(mockRepo.findByToken("test-token")).thenReturn(Optional.of(qrLogin));

        Optional<QrLogin> result = service.findByToken("test-token");
        assertTrue(result.isPresent());
    }

    @Test
    void testIssueMobileToken() {
        QrLoginRepository mockRepo = mock(QrLoginRepository.class);
        QrService service = new QrService();
        service.qrRepo = mockRepo;

        QrLogin qrLogin = new QrLogin();
        qrLogin.setUserId(1L);
        qrLogin.setToken("token");

        String jwt = service.issueMobileToken(qrLogin);

        assertNotNull(jwt);
        assertTrue(jwt.contains("."));
        assertTrue(qrLogin.isUsed());
        assertNotNull(qrLogin.getMobileToken());
        assertNotNull(qrLogin.getMobileTokenExpiresAt());
        verify(mockRepo).persist(qrLogin);
    }
}
