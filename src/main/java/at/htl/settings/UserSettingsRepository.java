package at.htl.settings;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.util.Optional;

@ApplicationScoped
public class UserSettingsRepository {

    @Inject
    EntityManager entityManager;

    public Optional<UserSettings> findByUserId(Long userId) {
        return Optional.ofNullable(entityManager.find(UserSettings.class, userId));
    }

    /** Stores the user's preferences, creating the row on the first change. */
    @Transactional
    public UserSettings save(Long userId, UserSettingsDto dto) {
        UserSettings settings = findByUserId(userId).orElseGet(() -> {
            UserSettings created = new UserSettings(userId);
            entityManager.persist(created);
            return created;
        });
        settings.setTheme(dto.theme());
        return settings;
    }
}
