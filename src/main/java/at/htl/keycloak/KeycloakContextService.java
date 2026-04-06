package at.htl.keycloak;

import io.quarkus.oidc.UserInfo;
import io.quarkus.oidc.runtime.OidcJwtCallerPrincipal;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.util.Optional;

@RequestScoped
public class KeycloakContextService {

    @Inject
    SecurityIdentity securityIdentity;

    /**
     * Get the Keycloak user ID (subject claim) from the current token
     */
    public String getKeycloakUserId() {
        if (!securityIdentity.isAnonymous()) {
            return securityIdentity.getPrincipal().getName();
        }
        return null;
    }

    /**
     * Get the Keycloak username from the current token
     */
    public String getUsername() {
        return getClaim("username");
    }

    /**
     * Get user's email from the token
     */
    public String getEmail() {
        return getClaim("email");
    }

    /**
     * Get user's display name from the token
     */
    public String getDisplayName() {
        return getClaim("display_name");
    }

    /**
     * Get user's biography from the token
     */
    public String getBiography() {
        return getClaim("biography");
    }

    /**
     * Get user's first name from the token
     */
    public String getFirstName() {
        return getClaim("given_name");
    }

    /**
     * Get user's last name from the token
     */
    public String getLastName() {
        return getClaim("family_name");
    }

    /**
     * Get any custom claim from the token
     */
    public String getClaim(String claimName) {
        if (securityIdentity.isAnonymous()) {
            return null;
        }

        if (securityIdentity.getPrincipal() instanceof OidcJwtCallerPrincipal) {
            OidcJwtCallerPrincipal principal = (OidcJwtCallerPrincipal) securityIdentity.getPrincipal();
            return principal.getClaim(claimName);
        }

        return null;
    }

    /**
     * Check if user is authenticated
     */
    public boolean isAuthenticated() {
        return !securityIdentity.isAnonymous();
    }

    /**
     * Get all claims as an object (for advanced use cases)
     */
    public Optional<Object> getClaimObject(String claimName) {
        if (securityIdentity.isAnonymous()) {
            return Optional.empty();
        }

        if (securityIdentity.getPrincipal() instanceof OidcJwtCallerPrincipal) {
            OidcJwtCallerPrincipal principal = (OidcJwtCallerPrincipal) securityIdentity.getPrincipal();
            try {
                return Optional.ofNullable(principal.getClaim(claimName));
            } catch (Exception e) {
                return Optional.empty();
            }
        }

        return Optional.empty();
    }
}
