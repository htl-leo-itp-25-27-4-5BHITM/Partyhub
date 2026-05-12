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

    private void sendToApple(String token, String message) {
        String payload = """
            {
                "aps": {
                    "alert": {
                        "title": "PartyHub Update",
                        "body": "%s"
                    },
                    "badge": 1,
                    "sound": "default"
                }
            }
            """.formatted(message);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(APNS_SERVER + "/3/device/" + token))
                .header("apns-topic", "at.htl.partyhub") // Deine Bundle ID
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        // Sends asynchronously so the backend is not blocked
        httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenAccept(res -> System.out.println("Push an " + token + " Status: " + res.statusCode()));
    }
}
