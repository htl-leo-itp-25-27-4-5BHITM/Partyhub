package at.htl.auth;

import at.htl.user.User;
import at.htl.user.UserRepository;
import at.htl.notificationsettings.UserNotificationSettingsRepository;
import io.quarkus.runtime.LaunchMode;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.validation.Validation;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.junit.jupiter.api.Test;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthenticationBoundaryTest {
    @Test void headerBypassCannotBeEnabledInDeployedMode() {
        assertFalse(XUserIdAuthFilter.allowsBypass(true,LaunchMode.NORMAL));
        assertFalse(XUserIdAuthFilter.allowsBypass(false,LaunchMode.DEVELOPMENT));
        assertTrue(XUserIdAuthFilter.allowsBypass(true,LaunchMode.TEST));
        assertTrue(XUserIdAuthFilter.allowsBypass(true,LaunchMode.DEVELOPMENT));
    }
    @Test void numericBearerSubjectDoesNotBecomeSomeoneElsesDatabaseId() {
        try(var factory=Validation.buildDefaultValidatorFactory()) {
            var resolver=new CurrentUserResolver();resolver.validator=factory.getValidator();
            resolver.userRepository=mock(UserRepository.class);
            resolver.notificationSettingsRepository=mock(UserNotificationSettingsRepository.class);
            resolver.welcomeEmailService=mock(WelcomeEmailService.class);
            resolver.jwt=mock(JsonWebToken.class);when(resolver.jwt.getSubject()).thenReturn("42");
            resolver.securityIdentity=mock(SecurityIdentity.class);when(resolver.securityIdentity.getPrincipal()).thenReturn(()->"42");
            User victim=new User();victim.setDisplayName("Victim");
            when(resolver.userRepository.findById(42L)).thenReturn(Optional.of(victim));
            when(resolver.userRepository.findByKeycloakId("42")).thenReturn(Optional.empty());
            when(resolver.userRepository.findUnlinkedByUsernameOrEmail(any(),any())).thenReturn(Optional.empty());
            User actual=resolver.requireCurrentUser();
            assertNotSame(victim,actual);assertEquals("42",actual.getKeycloakId());
            verify(resolver.userRepository,never()).findById(42L);
        }
    }
}
