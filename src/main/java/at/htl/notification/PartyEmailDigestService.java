package at.htl.notification;

import at.htl.notificationsettings.UserNotificationSettings;
import at.htl.notificationsettings.UserNotificationSettingsRepository;
import at.htl.party.Party;
import at.htl.user.User;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class PartyEmailDigestService {

    @Inject
    Logger logger;

    @Inject
    EntityManager entityManager;

    @Inject
    Mailer mailer;

    @Inject
    UserNotificationSettingsRepository settingsRepository;

    @ConfigProperty(name = "partyhub.notifications.email.from", defaultValue = "noreply@partyhub.at")
    String emailFrom;
    
    @ConfigProperty(name = "partyhub.notifications.email.enabled", defaultValue = "true")
    boolean emailEnabled;

    @Scheduled(cron = "0 0 10 ? * MON")
    void sendWeeklyDigest() {
        // Check if email notifications are globally enabled
        if (!emailEnabled) {
            logger.debug("Skipping weekly digest: email notifications disabled globally");
            return;
        }

        logger.info("Starting weekly party digest");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime twoWeeksLater = now.plusDays(14);

        List<Party> upcomingParties = entityManager.createQuery(
                        "SELECT DISTINCT p FROM Party p " +
                        "LEFT JOIN FETCH p.location " +
                        "WHERE p.time_start BETWEEN :now AND :twoWeeksLater " +
                        "ORDER BY p.time_start",
                        Party.class)
                .setParameter("now", now)
                .setParameter("twoWeeksLater", twoWeeksLater)
                .getResultList();

        if (upcomingParties.isEmpty()) {
            logger.debug("No upcoming parties for digest");
            return;
        }

        List<User> users = entityManager.createQuery(
                        "SELECT u FROM User u WHERE u.email IS NOT NULL", User.class)
                .getResultList();

        int sent = 0;
        for (User user : users) {
            if (shouldSendDigest(user) && sendDigest(user, upcomingParties)) {
                sent++;
            }
        }

        logger.infof("Weekly digest sent to %d users", sent);
    }

    private boolean shouldSendDigest(User user) {
        UserNotificationSettings settings = settingsRepository.findByUserId(user.getId()).orElse(null);
        if (settings == null) {
            return true;
        }
        return settings.isEmailEnabled() && settings.isPartyUpdates();
    }

    private boolean sendDigest(User user, List<Party> parties) {
        StringBuilder text = new StringBuilder();
        text.append("Hi ").append(user.getDisplayName() != null ? user.getDisplayName() : user.getUsername()).append(",\n\n");
        text.append("Here are the upcoming parties you might be interested in:\n\n");
        for (Party party : parties) {
            text.append("- ").append(party.getTitle());
            if (party.getTheme() != null) {
                text.append(" (").append(party.getTheme()).append(")");
            }
            text.append(" - ").append(party.getTime_start() != null ? party.getTime_start().toString() : "TBD");
            text.append("\n");
        }
        text.append("\nSee you there!\n\nPartyHub - Your Party Platform");

        try {
            mailer.send(Mail.withText(user.getEmail(), "PartyHub Weekly Digest", text.toString())
                    .setFrom(emailFrom));
            return true;
        } catch (RuntimeException e) {
            logger.warnf(e, "Skipping weekly digest for user %s because mail delivery failed: %s",
                    user.getId(), e.getMessage());
            return false;
        }
    }
}
