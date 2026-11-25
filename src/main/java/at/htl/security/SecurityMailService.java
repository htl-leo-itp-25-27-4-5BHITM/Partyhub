package at.htl.security;

import io.quarkus.mailer.Mail;
import io.quarkus.mailer.reactive.ReactiveMailer;
import io.quarkus.qute.Engine;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.event.TransactionPhase;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Duration;

/**
 * Sends security mails (HTML + plain text) after commit, with three retries. Logs name the user
 * and template only, never the address's link or token.
 */
@ApplicationScoped
public class SecurityMailService {

    @Inject
    Logger logger;

    @Inject
    ReactiveMailer mailer;

    @Inject
    Engine qute;

    @ConfigProperty(name = "partyhub.notifications.email.from", defaultValue = "noreply@partyhub.at")
    String emailFrom;

    void onCommitted(@Observes(during = TransactionPhase.AFTER_SUCCESS) SecurityMail mail) {
        send(mail);
    }

    public void send(SecurityMail mail) {
        if (mail.to() == null || mail.to().isBlank()) {
            logger.infof("Skipping security mail %s for user %s: no address", mail.template(), mail.userId());
            return;
        }
        String html;
        String text;
        try {
            html = qute.getTemplate("emails/security/" + mail.template() + ".html").data(mail.data()).render();
            text = qute.getTemplate("emails/security/" + mail.template() + ".txt").data(mail.data()).render();
        } catch (RuntimeException e) {
            logger.errorf("Could not render security mail %s for user %s: %s", mail.template(), mail.userId(), e.getMessage());
            return;
        }
        mailer.send(Mail.withHtml(mail.to(), mail.subject(), html).setText(text).setFrom(emailFrom))
                .onFailure().retry().withBackOff(Duration.ofSeconds(1), Duration.ofSeconds(30)).atMost(3)
                .subscribe().with(
                        ok -> logger.infof("Security mail %s sent for user %s", mail.template(), mail.userId()),
                        failure -> logger.errorf("Security mail %s for user %s failed after retries: %s",
                                mail.template(), mail.userId(), failure.getMessage()));
    }
}
