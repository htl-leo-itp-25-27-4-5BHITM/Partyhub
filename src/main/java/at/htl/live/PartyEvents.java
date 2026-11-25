package at.htl.live;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.event.TransactionPhase;
import jakarta.ws.rs.sse.Sse;
import jakarta.ws.rs.sse.SseEventSink;

import java.time.Instant;

/** Live streams per party for open detail pages: tells them when the guest list changed. */
@ApplicationScoped
public class PartyEvents {
    private final SseHub<Long> hub = new SseHub<>();

    public void subscribe(Long partyId, SseEventSink sink, Sse sse) {
        hub.subscribe(partyId, sink, sse, "ready");
    }

    void onChanged(@Observes(during = TransactionPhase.AFTER_SUCCESS) PartyChanged event) {
        if (event.partyId() == null) return;
        hub.broadcast(event.partyId(), "changed",
                "{\"partyId\":" + event.partyId() + ",\"at\":\"" + Instant.now() + "\"}");
    }

    @Scheduled(every = "25s")
    void heartbeat() {
        hub.heartbeat();
    }

    int subscriberCount(Long partyId) {
        return hub.count(partyId);
    }
}
