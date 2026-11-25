package at.htl;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

@ApplicationScoped
public class PushNotificationService {

    @Inject
    EntityManager em;

    @Inject
    com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_2)
            .build();

    // Sandbox URL for development
    private static final String APNS_SERVER = "https://api.sandbox.push.apple.com:443";

    public void notifyParticipants(Long partyId, String message) {
        // Finds all participant tokens listed in party_user
        List<String> tokens = em.createNativeQuery("""
            SELECT u.device_token FROM users u 
            JOIN party_user pu ON u.id = pu.user_id 
            WHERE pu.party_id = :partyId AND u.device_token IS NOT NULL
            """)
            .setParameter("partyId", partyId)
            .getResultList();

        for (String token : tokens) {
            sendToApple(token, message);
        }
    }

    String payload(String message) throws com.fasterxml.jackson.core.JsonProcessingException {
        return objectMapper.writeValueAsString(java.util.Map.of("aps", java.util.Map.of(
                "alert", java.util.Map.of("title", "PartyHub Update", "body", message),
                "badge", 1, "sound", "default")));
    }

    private void sendToApple(String token, String message) {
        if (!at.htl.validation.InputPolicy.deviceToken(token) || message == null) return;
        String payload;
        try { payload = payload(message); }
        catch (com.fasterxml.jackson.core.JsonProcessingException e) { return; }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(APNS_SERVER + "/3/device/" + token))
                .header("apns-topic", "at.htl.partyhub") // Deine Bundle ID
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        // Sends asynchronously so the backend is not blocked
        httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenAccept(res -> org.jboss.logging.Logger.getLogger(PushNotificationService.class).debugf("Push response status: %d", res.statusCode()));
    }
}
