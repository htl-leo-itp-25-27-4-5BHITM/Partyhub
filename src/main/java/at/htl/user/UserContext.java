package at.htl.user;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.jboss.logging.Logger;

@ApplicationScoped
public class UserContext {

    @Inject
    EntityManager entityManager;

    @Inject
    Logger logger;

    private Long currentUserId = 1L; // Default user

    public Long getCurrentUserId() {
        return currentUserId;
    }

    public void setCurrentUserId(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }

        User user = entityManager.find(User.class, userId);
        if (user == null) {
            throw new IllegalArgumentException("User with ID " + userId + " not found");
        }
        this.currentUserId = userId;
        logger.info("Current user switched to: " + userId + " (" + user.getDistinctName() + ")");
    }

    public User getCurrentUser() {
        return entityManager.find(User.class, currentUserId);
    }
    public void resetToDefault() {

        this.currentUserId = 1L;
        logger.info("User context reset to default (ID: 1)");
    }
}
