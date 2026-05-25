package at.htl.notificationsettings;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.util.Optional;

@ApplicationScoped
@Transactional
public class UserNotificationSettingsRepository {

    @Inject
    EntityManager entityManager;

    public Optional<UserNotificationSettings> findByUserId(Long userId) {
        if (userId == null) {
            return Optional.empty();
        }
        UserNotificationSettings settings = entityManager.find(UserNotificationSettings.class, userId);
        return Optional.ofNullable(settings);
    }

    public void save(UserNotificationSettings settings) {
        entityManager.merge(settings);
    }

    public void persist(UserNotificationSettings settings) {
        entityManager.persist(settings);
    }
}
