package at.htl.live;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.event.TransactionPhase;
import jakarta.ws.rs.sse.Sse;
import jakarta.ws.rs.sse.SseEventSink;

import java.time.Instant;

/**
 * Live streams per user: tells them when something they see changed. Events only name the kind of
 * change; clients refetch through the normal endpoints, so access checks stay in one place.
 */
@ApplicationScoped
public class UserEvents {
    private final SseHub<Long> hub = new SseHub<>();

    public void subscribe(Long userId, SseEventSink sink, Sse sse) {
        // "ready" tells the client the stream is open, so it can rely on it instead of fast polling.
        hub.subscribe(userId, sink, sse, "ready");
    }

    void onChanged(@Observes(during = TransactionPhase.AFTER_SUCCESS) UserChanged event) {
        if (event.userId() == null) return;
        hub.broadcast(event.userId(), "changed",
                "{\"kind\":\"" + event.kind() + "\",\"at\":\"" + Instant.now() + "\"}");
    }

    @Scheduled(every = "25s")
    void heartbeat() {
        hub.heartbeat();
    }

    int subscriberCount(Long userId) {
        return hub.count(userId);
    }
}
