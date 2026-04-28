package at.htl;

import io.quarkus.test.Mock;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Alternative;
import jakarta.annotation.Priority;

@Mock
@Alternative  // <--- Hinzufügen
@Priority(1)  // <--- Hinzufügen (irgendeine Zahl > 0)
@ApplicationScoped
public class MockPushService extends PushNotificationService {
    @Override
    public void notifyParticipants(Long partyId, String message) {
        System.out.println("CI-Test: Push unterdrückt für Party " + partyId);
    }
}