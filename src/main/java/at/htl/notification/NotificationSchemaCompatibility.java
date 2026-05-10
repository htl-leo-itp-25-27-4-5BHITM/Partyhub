package at.htl.notification;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class NotificationSchemaCompatibility {

    private static final Logger LOG = Logger.getLogger(NotificationSchemaCompatibility.class);

    @Inject
    EntityManager entityManager;

    @ConfigProperty(name = "quarkus.datasource.db-kind", defaultValue = "")
    String dbKind;

    @Transactional
    void allowNotificationsWithoutParty(@Observes StartupEvent event) {
        if (!"postgresql".equalsIgnoreCase(dbKind)) {
            return;
        }

        try {
            entityManager
                    .createNativeQuery("ALTER TABLE notification ALTER COLUMN party_id DROP NOT NULL")
                    .executeUpdate();
        } catch (RuntimeException e) {
            LOG.debug("notification.party_id already nullable or schema not ready", e);
        }

        try {
            entityManager
                    .createNativeQuery("ALTER TABLE invitation ADD COLUMN IF NOT EXISTS status varchar(255)")
                    .executeUpdate();
            entityManager
                    .createNativeQuery("UPDATE invitation SET status = 'PENDING' WHERE status IS NULL")
                    .executeUpdate();
            entityManager
                    .createNativeQuery("ALTER TABLE invitation ALTER COLUMN status SET DEFAULT 'PENDING'")
                    .executeUpdate();
            entityManager
                    .createNativeQuery("ALTER TABLE invitation ALTER COLUMN status SET NOT NULL")
                    .executeUpdate();
        } catch (RuntimeException e) {
            LOG.debug("invitation.status already present or schema not ready", e);
        }
    }
}
