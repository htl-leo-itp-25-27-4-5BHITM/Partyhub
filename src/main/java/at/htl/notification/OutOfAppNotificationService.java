package at.htl.notification;

import at.htl.notificationsettings.UserNotificationSettings;
import at.htl.notificationsettings.UserNotificationSettingsRepository;
import at.htl.party.Party;
import at.htl.user.User;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class OutOfAppNotificationService {

    @Inject
    Logger logger;

    @Inject
    Mailer mailer;

    @Inject
    UserNotificationSettingsRepository settingsRepository;

    @ConfigProperty(name = "partyhub.notifications.email.from", defaultValue = "noreply@partyhub.at")
    String emailFrom;
    @ConfigProperty(name = "partyhub.notifications.email.enabled", defaultValue = "true")
    boolean emailEnabled;

    public void sendNotification(Notification notification) {
        if (notification == null) {
            return;
        }

        Party party = notification.getParty();
        String partyTitle = party != null ? party.getTitle() : "Party";
        send(notification.getRecipient(), "PartyHub: " + partyTitle, notification.getMessage());
    }

    public void send(User recipient, String subject, String message) {
        if (recipient == null || message == null || message.isBlank()) {
            return;
        }

        // Check if email notifications are globally enabled
        if (!emailEnabled) {
            logger.debugf("Skipping email for user %s: email notifications disabled globally", recipient != null ? recipient.getId() : null);
            return;
        }

        if (recipient.getId() != null) {
            UserNotificationSettings settings = settingsRepository.findByUserId(recipient.getId()).orElse(null);
            if (settings != null && !settings.isEmailEnabled()) {
                logger.debugf("Skipping email for user %s: email notifications disabled", recipient.getId());
                return;
            }
        }

        sendEmail(recipient, subject, message);
    }

    private void sendEmail(User recipient, String subject, String message) {
        String to = recipient.getEmail();
        if (isBlank(to)) {
            logger.debugf("Skipping email notification for user %s: no email address", recipient.getId());
            return;
        }

        try {
            logger.infof("Sending email to user %s at %s: %s", recipient.getId(), to, subject);
            mailer.send(Mail.withText(to, subject, message).setFrom(emailFrom));
        } catch (RuntimeException e) {
            logger.warnf(
                    e,
                    "Skipping email notification for user %s because mail delivery failed: %s",
                    recipient.getId(),
                    e.getMessage());
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
