package at.htl.live;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.event.TransactionPhase;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/** Records committed user changes so tests can assert who gets notified about what. */
@ApplicationScoped
public class UserChangedRecorder {
    private final List<UserChanged> events = new CopyOnWriteArrayList<>();

    void record(@Observes(during = TransactionPhase.AFTER_SUCCESS) UserChanged event) {
        events.add(event);
    }

    public boolean received(Long userId, String kind) {
        return events.stream().anyMatch(e -> e.userId().equals(userId) && e.kind().equals(kind));
    }

    public void clear() {
        events.clear();
    }
}
