package at.htl.security;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.time.Duration;
import java.time.Instant;

/**
 * An e-mail change needs a password confirmation at Keycloak within the last minutes. Keycloak
 * records that time in the token's {@code auth_time} claim; the browser gets a fresh one by
 * logging in again with {@code prompt=login}.
 */
@RequestScoped
public class ReauthPolicy {

    static final Duration MAX_AGE = Duration.ofMinutes(5);

    @Inject
    JsonWebToken jwt;

    @Inject
    SecurityIdentity identity;

    @ConfigProperty(name = "partyhub.auth.bypass-enabled", defaultValue = "false")
    boolean bypassEnabled;

    public boolean recentlyAuthenticated() {
        // The dev/test X-User-Id bypass has no token; it is never enabled in production.
        if (bypassEnabled && isNumericPrincipal()) {
            return true;
        }
        Object claim = safeAuthTime();
        Long authTime = claim instanceof Number number ? Long.valueOf(number.longValue())
                : claim != null ? parse(claim.toString()) : null;
        return isFresh(authTime, Instant.now());
    }

    static boolean isFresh(Long authTimeSeconds, Instant now) {
        if (authTimeSeconds == null) {
            return false;
        }
        Instant authTime = Instant.ofEpochSecond(authTimeSeconds);
        return !authTime.isAfter(now.plusSeconds(60)) && Duration.between(authTime, now).compareTo(MAX_AGE) <= 0;
    }

    private Object safeAuthTime() {
        try {
            return jwt.getClaim("auth_time");
        } catch (RuntimeException e) {
            return null;
        }
    }

    private boolean isNumericPrincipal() {
        if (identity == null || identity.isAnonymous() || identity.getPrincipal() == null) {
            return false;
        }
        return identity.getPrincipal().getName().matches("\\d+");
    }

    private static Long parse(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
