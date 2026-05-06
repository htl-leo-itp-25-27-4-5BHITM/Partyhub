package at.htl.notification;

import at.htl.party.Party;
import at.htl.user.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;

@ApplicationScoped
public class OutOfAppNotificationService {

    @Inject
    Logger logger;

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "partyhub.notifications.email.enabled", defaultValue = "false")
    boolean emailEnabled;

    @ConfigProperty(name = "partyhub.notifications.sms.enabled", defaultValue = "false")
    boolean smsEnabled;

    @ConfigProperty(name = "partyhub.notifications.email.from", defaultValue = "not-configured")
    String emailFrom;

    @ConfigProperty(name = "partyhub.notifications.resend.api-key", defaultValue = "not-configured")
    String resendApiKey;

    @ConfigProperty(name = "partyhub.notifications.twilio.account-sid", defaultValue = "not-configured")
    String twilioAccountSid;

    @ConfigProperty(name = "partyhub.notifications.twilio.auth-token", defaultValue = "not-configured")
    String twilioAuthToken;

    @ConfigProperty(name = "partyhub.notifications.twilio.from", defaultValue = "not-configured")
    String twilioFrom;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

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

        logger.infof("Out-of-app notification requested for user %s (emailEnabled=%s, smsEnabled=%s)",
                recipient.getId(), emailEnabled, smsEnabled);

        if (emailEnabled) {
            sendEmail(recipient, subject, message);
        }

        if (smsEnabled) {
            sendSms(recipient, message);
        }

        if (!emailEnabled && !smsEnabled) {
            logger.debugf("Out-of-app notifications disabled. Would notify user %s: %s",
                    recipient.getId(), message);
        }
    }

    private void sendEmail(User recipient, String subject, String message) {
        String to = recipient.getEmail();
        if (isBlank(to)) {
            logger.debugf("Skipping email notification for user %s: no email address", recipient.getId());
            return;
        }

        if (!isConfigured(resendApiKey) || !isConfigured(emailFrom)) {
            logger.warn("Email notifications are enabled, but Resend API key or from address is missing");
            return;
        }

        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "from", emailFrom,
                    "to", new String[]{to},
                    "subject", subject,
                    "text", message
            ));

            HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.resend.com/emails"))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                logger.warnf("Email notification failed for user %s: HTTP %d %s",
                        recipient.getId(), response.statusCode(), response.body());
            } else {
                logger.infof("Email notification sent for user %s to %s", recipient.getId(), to);
            }
        } catch (IOException e) {
            logger.warnf("Email notification failed for user %s: %s", recipient.getId(), e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.warnf("Email notification interrupted for user %s", recipient.getId());
        }
    }

    private void sendSms(User recipient, String message) {
        String phoneNumber = recipient.getPhoneNumber();
        if (isBlank(phoneNumber)) {
            logger.debugf("Skipping SMS notification for user %s: no phone number", recipient.getId());
            return;
        }

        if (!isConfigured(twilioAccountSid) || !isConfigured(twilioAuthToken) || !isConfigured(twilioFrom)) {
            logger.warn("SMS notifications are enabled, but Twilio account SID, auth token or from number is missing");
            return;
        }

        String form = "To=" + encode(phoneNumber) +
                "&From=" + encode(twilioFrom) +
                "&Body=" + encode(message);
        String credentials = twilioAccountSid + ":" + twilioAuthToken;
        String basicAuth = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(
                            "https://api.twilio.com/2010-04-01/Accounts/" + twilioAccountSid + "/Messages.json"))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Basic " + basicAuth)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(form))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                logger.warnf("SMS notification failed for user %s: HTTP %d %s",
                        recipient.getId(), response.statusCode(), response.body());
            } else {
                logger.infof("SMS notification sent for user %s to %s", recipient.getId(), phoneNumber);
            }
        } catch (IOException e) {
            logger.warnf("SMS notification failed for user %s: %s", recipient.getId(), e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.warnf("SMS notification interrupted for user %s", recipient.getId());
        }
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private boolean isConfigured(String value) {
        return !isBlank(value) && !"not-configured".equals(value);
    }
}
