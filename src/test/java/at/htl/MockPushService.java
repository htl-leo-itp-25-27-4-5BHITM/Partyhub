package at.htl;

import io.quarkus.test.Mock;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Alternative;
import jakarta.annotation.Priority;

@Mock
@Alternative  // <--- Add
@Priority(1)  // <--- Add (any number > 0)
@ApplicationScoped
public class MockPushService extends PushNotificationService {
    @Override
    public void notifyParticipants(Long partyId, String message) {
        System.out.println("CI test: push suppressed for party " + partyId);
    }
}
