package at.htl.security;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class SecurityHelpersTest {

    @Test
    void tokensAreRandomUrlSafeAndHashedDeterministically() {
        Set<String> tokens = new HashSet<>();
        for (int i = 0; i < 100; i++) {
            String token = SecurityTokens.newToken();
            assertTrue(token.matches("[A-Za-z0-9_-]{43}"), token);
            tokens.add(token);
        }
        assertEquals(100, tokens.size());
        String token = SecurityTokens.newToken();
        assertEquals(SecurityTokens.hash(token), SecurityTokens.hash(token));
        assertEquals(64, SecurityTokens.hash(token).length());
        assertNotEquals(token, SecurityTokens.hash(token));
    }

    @Test
    void emailsAreMasked() {
        assertEquals("ma***@example.com", SecurityTokens.maskEmail("max.muster@example.com"));
        assertEquals("a***@x.at", SecurityTokens.maskEmail("ab@x.at"));
        assertEquals("***", SecurityTokens.maskEmail("broken"));
    }

    @Test
    void userAgentsAreSummarised() {
        assertEquals("Firefox on Windows", UserAgentSummary.of(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0"));
        assertEquals("Chrome on Android", UserAgentSummary.of(
                "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36"));
        assertEquals("Edge on Windows", UserAgentSummary.of(
                "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/130.0 Safari/537.36 Edg/130.0"));
        assertEquals("Safari on iOS", UserAgentSummary.of(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1"));
        assertEquals("an unknown browser", UserAgentSummary.of(null));
    }

    @Test
    void reauthenticationMustBeAtMostFiveMinutesOld() {
        Instant now = Instant.parse("2026-11-25T10:00:00Z");
        assertTrue(ReauthPolicy.isFresh(now.minusSeconds(60).getEpochSecond(), now));
        assertTrue(ReauthPolicy.isFresh(now.minusSeconds(300).getEpochSecond(), now));
        assertFalse(ReauthPolicy.isFresh(now.minusSeconds(301).getEpochSecond(), now));
        assertFalse(ReauthPolicy.isFresh(null, now));
        assertFalse(ReauthPolicy.isFresh(now.plusSeconds(3600).getEpochSecond(), now));
    }
}
