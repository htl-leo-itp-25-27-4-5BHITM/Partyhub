package at.htl.user;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.logging.Logger;

@ApplicationScoped
public class UserContext {

    @Inject
    EntityManager entityManager;

    @Inject
    Logger logger;

    @Inject
    SecurityIdentity securityIdentity;

    @Inject
    JsonWebToken jwt;

    public Long getCurrentUserId() {
        User user = getCurrentUser();
        return user != null ? user.getId() : null;
    }

    public User getCurrentUser() {
        if (securityIdentity.isAnonymous()) {
            logger.debug("Anonymous user detected");
            return null;
        }

        String email = jwt.getClaim("email");
        String preferredUsername = jwt.getClaim("preferred_username");
        String subject = jwt.getSubject();

        logger.debug("JWT Claims - email: " + email + ", preferred_username: " + preferredUsername + ", subject: " + subject);

        User user = null;

        if (email != null && !email.isEmpty()) {
            user = findByEmail(email);
        }

        if (user == null && preferredUsername != null && !preferredUsername.isEmpty()) {
            user = findByDistinctName(preferredUsername);
        }

        if (user == null && subject != null) {
            user = findByKeycloakId(subject);
        }

        if (user == null) {
            logger.warn("No user found for JWT claims. Creating or linking user may be needed.");
        }

        return user;
    }

    private User findByEmail(String email) {
        try {
            return entityManager.createQuery(
                            "SELECT u FROM User u WHERE u.email = :email", User.class)
                    .setParameter("email", email)
                    .getSingleResult();
        } catch (Exception e) {
            return null;
        }
    }

    private User findByDistinctName(String distinctName) {
        try {
            return entityManager.createQuery(
                            "SELECT u FROM User u WHERE u.distinctName = :distinctName", User.class)
                    .setParameter("distinctName", distinctName)
                    .getSingleResult();
        } catch (Exception e) {
            return null;
        }
    }

    private User findByKeycloakId(String keycloakId) {
        return null;
    }

    public String getCurrentUserEmail() {
        return jwt.getClaim("email");
    }

    public String getCurrentUserName() {
        String name = jwt.getClaim("name");
        if (name == null) {
            name = jwt.getClaim("preferred_username");
        }
        return name;
    }
}
