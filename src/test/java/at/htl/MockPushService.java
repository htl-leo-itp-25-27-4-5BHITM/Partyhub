package at.htl;

import io.quarkus.test.Mock;
import jakarta.enterprise.context.ApplicationScoped;


@Mock
@ApplicationScoped
public class MockPushService extends PushNotificationService {
    @Override
    public void notifyParticipants(Long partyId, String message) {
        System.out.println("CI-Test: Push unterdrückt für Party " + partyId);
    }
}