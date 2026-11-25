package at.htl.auth;

import at.htl.user.User;
import at.htl.user.UserRepository;
import at.htl.notificationsettings.UserNotificationSettingsRepository;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.validation.Validation;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.junit.jupiter.api.Test;
import java.util.Map;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ImportedProfileInputTest {
    User provision(Map<String, Object> claims) {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var resolver = new CurrentUserResolver();
            resolver.validator = factory.getValidator();
            resolver.userRepository = mock(UserRepository.class);
            resolver.notificationSettingsRepository = mock(UserNotificationSettingsRepository.class);
            resolver.welcomeEmailService = mock(WelcomeEmailService.class);
            resolver.securityIdentity = mock(SecurityIdentity.class);
            when(resolver.securityIdentity.getPrincipal()).thenReturn(() -> "subject-unchanged");
            resolver.jwt = mock(JsonWebToken.class);
            when(resolver.jwt.getClaim(anyString())).thenAnswer(call -> claims.get(call.getArgument(0)));
            when(resolver.userRepository.findByKeycloakId(anyString())).thenReturn(Optional.empty());
            when(resolver.userRepository.findUnlinkedByUsernameOrEmail(any(), any())).thenReturn(Optional.empty());
            return resolver.requireCurrentUser();
        }
    }

    @Test void invalidOptionalClaimsFallBackWithoutChangingSubject() {
        User user = provision(Map.of("preferred_username", "bad\nhandle", "email", "not-an-email", "name", "x".repeat(256)));
        assertEquals("subject-unchanged", user.getKeycloakId());
        assertEquals("keycloak_subject-unchanged", user.getUsername());
        assertEquals(user.getUsername(), user.getDisplayName());
        assertNull(user.getEmail());
    }

    @Test void structuredClaimsAreNotStringifiedAndUnicodeIsPreserved() {
        User user = provision(Map.of("preferred_username", "özlem", "email", Map.of("value", "fake@example.com"), "name", "李 O'Brien 🎉"));
        assertEquals("özlem", user.getUsername());
        assertEquals("李 O'Brien 🎉", user.getDisplayName());
        assertNull(user.getEmail());
        User objectName = provision(Map.of("name", Map.of("html", "x")));
        assertEquals(objectName.getUsername(), objectName.getDisplayName());
    }
}
