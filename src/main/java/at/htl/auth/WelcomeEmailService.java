package at.htl.auth;

import at.htl.user.User;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import io.quarkus.qute.Location;
import io.quarkus.qute.Template;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class WelcomeEmailService {

    @Inject
    Logger logger;

    @Inject
    Mailer mailer;

    @Location("emails/welcome.html")
    Template welcomeHtml;

    @Location("emails/welcome.txt")
    Template welcomeText;

    @ConfigProperty(name = "partyhub.notifications.email.from", defaultValue = "noreply@partyhub.at")
    String emailFrom;

    @ConfigProperty(name = "partyhub.web.url", defaultValue = "http://localhost:8080")
    String webUrl;

    @ConfigProperty(name = "partyhub.keycloak.issuer", defaultValue = "http://localhost:8000/realms/partyhub")
    String keycloakIssuer;

    public void sendWelcomeEmail(User user) {
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            logger.debugf("Skipping welcome email for user %s: no email", user != null ? user.getId() : null);
            return;
        }

        String keycloakAuthUrl = keycloakIssuer + "/protocol/openid-connect/auth"
                + "?client_id=frontend"
                + "&redirect_uri=" + webUrl + "/auth/callback.html"
                + "&response_type=code"
                + "&scope=openid";

        try {
            String html = welcomeHtml
                    .data("displayName", user.getDisplayName())
                    .data("userId", user.getId())
                    .data("webUrl", webUrl)
                    .data("keycloakAuthUrl", keycloakAuthUrl)
                    .render();

            String text = welcomeText
                    .data("displayName", user.getDisplayName())
                    .data("userId", user.getId())
                    .data("webUrl", webUrl)
                    .data("keycloakAuthUrl", keycloakAuthUrl)
                    .render();

            mailer.send(Mail.withHtml(user.getEmail(), "Welcome to PartyHub!", html)
                    .setFrom(emailFrom));

            logger.infof("Welcome email sent to user %s at %s", user.getId(), user.getEmail());
        } catch (Exception e) {
            logger.errorf("Failed to send welcome email to user %s: %s", user.getId(), e.getMessage());
        }
    }
}