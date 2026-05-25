package at.htl.auth;

import java.util.Optional;

import at.htl.notificationsettings.UserNotificationSettings;
import at.htl.notificationsettings.UserNotificationSettingsRepository;
import at.htl.user.User;
import at.htl.user.UserRepository;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotAuthorizedException;
import org.eclipse.microprofile.jwt.JsonWebToken;

@ApplicationScoped
public class CurrentUserResolver {

    @Inject
    UserRepository userRepository;

    @Inject
    UserNotificationSettingsRepository notificationSettingsRepository;

    @Inject
    JsonWebToken jwt;

    @Inject
    SecurityIdentity securityIdentity;

    @Transactional
    public User requireCurrentUser() {
        String subject = currentSubject()
                .filter(value -> !value.isBlank())
                .orElseThrow(() -> new NotAuthorizedException("Bearer token required"));

        // Auth bypass: X-User-Id header sends numeric user ID
        Optional<User> byId = tryFindByNumericId(subject);
        if (byId.isPresent()) {
            return byId.get();
        }

        return userRepository.findByKeycloakId(subject)
                .orElseGet(() -> linkOrCreateUser(subject));
    }

    @Transactional
    public Optional<User> currentUserIfAuthenticated() {
        if (securityIdentity == null || securityIdentity.isAnonymous()) {
            return Optional.empty();
        }

        return currentSubject()
                .filter(value -> !value.isBlank())
                .map(subject -> {
                    // Auth bypass: X-User-Id header sends numeric user ID
                    Optional<User> byId = tryFindByNumericId(subject);
                    if (byId.isPresent()) {
                        return byId.get();
                    }
                    return userRepository.findByKeycloakId(subject)
                            .orElseGet(() -> linkOrCreateUser(subject));
                });
    }

    public Long requireCurrentUserId() {
        return requireCurrentUser().getId();
    }

    public Optional<Long> currentUserIdIfAuthenticated() {
        return currentUserIfAuthenticated().map(User::getId);
    }

    private Optional<User> tryFindByNumericId(String subject) {
        try {
            long id = Long.parseLong(subject);
            return userRepository.findById(id);
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    private User linkOrCreateUser(String subject) {
        String username = claimAsString("preferred_username")
                .or(() -> claimAsString("username"))
                .or(this::principalName)
                .orElse(null);
        String email = claimAsString("email").orElse(null);

        Optional<User> existingUser = userRepository.findUnlinkedByUsernameOrEmail(username, email);
        if (existingUser.isPresent()) {
            return userRepository.linkKeycloakId(existingUser.get(), subject);
        }

        User user = new User();
        user.setKeycloakId(subject);
        user.setUsername(defaultIfBlank(username, "keycloak_" + compactSubject(subject)));
        user.setDistinctName(defaultIfBlank(username, user.getUsername()));
        user.setEmail(email);
        user.setDisplayName(claimAsString("name")
                .or(() -> claimAsString("given_name"))
                .orElse(user.getUsername()));
        userRepository.persist(user);

        UserNotificationSettings settings = new UserNotificationSettings(user);
        notificationSettingsRepository.persist(settings);

        return user;
    }

    private Optional<String> currentSubject() {
        Optional<String> tokenSubject = claimAsString("sub")
                .or(() -> safeString(() -> jwt.getSubject()));
        if (tokenSubject.isPresent()) {
            return tokenSubject;
        }

        return principalName();
    }

    private Optional<String> principalName() {
        if (securityIdentity == null ||
                securityIdentity.isAnonymous() ||
                securityIdentity.getPrincipal() == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(securityIdentity.getPrincipal().getName());
    }

    private Optional<String> claimAsString(String claimName) {
        return safeString(() -> {
            Object value = jwt.getClaim(claimName);
            return value != null ? value.toString() : null;
        });
    }

    private Optional<String> safeString(StringSupplier supplier) {
        try {
            String value = supplier.get();
            if (value == null || value.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(value);
        } catch (RuntimeException ignored) {
            return Optional.empty();
        }
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String compactSubject(String subject) {
        String compact = subject.replaceAll("[^a-zA-Z0-9_-]", "_");
        return compact.length() <= 24 ? compact : compact.substring(0, 24);
    }

    @FunctionalInterface
    private interface StringSupplier {
        String get();
    }
}
