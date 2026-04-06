package at.htl.user;

import at.htl.keycloak.KeycloakContextService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.Optional;

@ApplicationScoped
public class KeycloakUserService {

    @Inject
    UserRepository userRepository;

    @Inject
    KeycloakContextService keycloakContext;

    /**
     * Get or create a user from the current Keycloak token.
     * Synchronizes user data from Keycloak with local PartyHub database.
     */
    @Transactional
    public Optional<User> getOrCreateCurrentUser() {
        if (!keycloakContext.isAuthenticated()) {
            return Optional.empty();
        }

        String keycloakId = keycloakContext.getKeycloakUserId();
        String username = keycloakContext.getUsername();

        // Try to find existing user by keycloakId
        Optional<User> existingUser = userRepository.findByKeycloakId(keycloakId);

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            // Update user data from Keycloak token
            syncUserFromKeycloak(user);
            return Optional.of(user);
        }

        // Try to find by username as fallback
        if (username != null) {
            Optional<User> userByUsername = userRepository.findByUsername(username);
            if (userByUsername.isPresent()) {
                User user = userByUsername.get();
                user.setKeycloakId(keycloakId);
                syncUserFromKeycloak(user);
                return Optional.of(user);
            }
        }

        // Create new user from Keycloak token
        User newUser = new User();
        newUser.setKeycloakId(keycloakId);
        newUser.setUsername(username);
        syncUserFromKeycloak(newUser);

        // Save and return
        userRepository.persist(newUser);
        return Optional.of(newUser);
    }

    /**
     * Synchronize user data from Keycloak token into the User entity
     */
    private void syncUserFromKeycloak(User user) {
        String username = keycloakContext.getUsername();
        String email = keycloakContext.getEmail();
        String displayName = keycloakContext.getDisplayName();
        String biography = keycloakContext.getBiography();

        // Update fields if not already set or if token has newer values
        if (username != null) {
            user.setUsername(username);
            // Use username as distinct_name if not set
            if (user.getDistinctName() == null) {
                user.setDistinctName(username);
            }
        }

        if (email != null) {
            user.setEmail(email);
        }

        if (displayName != null) {
            user.setDisplayName(displayName);
        } else if (user.getDisplayName() == null) {
            // Generate display name from first/last name or username
            String firstName = keycloakContext.getFirstName();
            String lastName = keycloakContext.getLastName();
            if (firstName != null && lastName != null) {
                user.setDisplayName(firstName + " " + lastName);
            } else if (firstName != null) {
                user.setDisplayName(firstName);
            } else if (username != null) {
                user.setDisplayName(username);
            }
        }

        if (biography != null) {
            user.setBiography(biography);
        }
    }

    /**
     * Update user profile from Keycloak data
     */
    @Transactional
    public User updateUserFromKeycloak(Long userId) {
        var userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            syncUserFromKeycloak(user);
            return user;
        }
        return null;
    }
}
