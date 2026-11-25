package at.htl.security;

import com.fasterxml.jackson.databind.JsonNode;
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
import java.util.Map;

/**
 * The few Keycloak Admin API calls the e-mail change needs, made with the dedicated
 * "partyhub-backend-admin" service account (client credentials, manage-users only).
 */
@ApplicationScoped
public class KeycloakAccountService {

    /** Keycloak could not be reached or refused the call; the caller keeps its state unchanged. */
    public static class KeycloakUnavailableException extends RuntimeException {
        public KeycloakUnavailableException(String message) {
            super(message);
        }
    }

    @Inject
    Logger logger;

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "partyhub.keycloak.issuer")
    String issuer;

    @ConfigProperty(name = "partyhub.keycloak.admin.client-id")
    String clientId;

    @ConfigProperty(name = "partyhub.keycloak.admin.client-secret")
    java.util.Optional<String> clientSecret;

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    /** True if a Keycloak account other than {@code ownKeycloakId} uses this e-mail address. */
    public boolean emailUsedByOtherAccount(String email, String ownKeycloakId) {
        String url = adminUrl() + "/users?exact=true&briefRepresentation=true&email="
                + URLEncoder.encode(email, StandardCharsets.UTF_8);
        JsonNode users = send(HttpRequest.newBuilder(URI.create(url)).GET(), "search users by e-mail");
        for (JsonNode user : users) {
            if (!user.path("id").asText().equals(ownKeycloakId)) {
                return true;
            }
        }
        return false;
    }

    /** Sets the account's e-mail and marks it verified, since the user just confirmed the link. */
    public void updateEmail(String keycloakId, String email) {
        try {
            String body = objectMapper.writeValueAsString(Map.of("email", email, "emailVerified", true));
            send(HttpRequest.newBuilder(URI.create(adminUrl() + "/users/" + keycloakId))
                    .header("Content-Type", "application/json")
                    .PUT(HttpRequest.BodyPublishers.ofString(body)), "update e-mail");
        } catch (IOException e) {
            throw new KeycloakUnavailableException("Could not build Keycloak request");
        }
    }

    /** Keycloak's own "forgot password" page, used as the target of "This wasn't me" links. */
    public String passwordResetUrl() {
        return issuer + "/login-actions/reset-credentials?client_id=frontend";
    }

    private String adminUrl() {
        // https://host/keycloak/realms/partyhub -> https://host/keycloak/admin/realms/partyhub
        int realms = issuer.lastIndexOf("/realms/");
        return issuer.substring(0, realms) + "/admin" + issuer.substring(realms);
    }

    private JsonNode send(HttpRequest.Builder request, String action) {
        try {
            HttpResponse<String> response = http.send(
                    request.header("Authorization", "Bearer " + serviceAccountToken())
                            .timeout(Duration.ofSeconds(10)).build(),
                    HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                logger.warnf("Keycloak admin call '%s' failed with HTTP %d", action, response.statusCode());
                throw new KeycloakUnavailableException("Keycloak refused: " + action);
            }
            return response.body() == null || response.body().isBlank()
                    ? objectMapper.createObjectNode() : objectMapper.readTree(response.body());
        } catch (IOException e) {
            logger.warnf("Keycloak admin call '%s' failed: %s", action, e.getMessage());
            throw new KeycloakUnavailableException("Keycloak unreachable: " + action);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new KeycloakUnavailableException("Interrupted: " + action);
        }
    }

    private String serviceAccountToken() throws IOException, InterruptedException {
        String secret = clientSecret.filter(value -> !value.isBlank())
                .orElseThrow(() -> new KeycloakUnavailableException("Keycloak admin client secret is not configured"));
        String form = "grant_type=client_credentials&client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
                + "&client_secret=" + URLEncoder.encode(secret, StandardCharsets.UTF_8);
        HttpResponse<String> response = http.send(HttpRequest.newBuilder(URI.create(issuer + "/protocol/openid-connect/token"))
                        .header("Content-Type", "application/x-www-form-urlencoded")
                        .timeout(Duration.ofSeconds(10))
                        .POST(HttpRequest.BodyPublishers.ofString(form)).build(),
                HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            logger.warnf("Keycloak service-account login failed with HTTP %d", response.statusCode());
            throw new KeycloakUnavailableException("Keycloak service-account login failed");
        }
        return objectMapper.readTree(response.body()).path("access_token").asText();
    }
}
