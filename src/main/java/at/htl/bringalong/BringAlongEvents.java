package at.htl.bringalong;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.event.TransactionPhase;
import jakarta.ws.rs.sse.Sse;
import jakarta.ws.rs.sse.SseEventSink;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Keeps the open SSE streams per party and tells them when the list changed.
 * Events carry no list data; clients refetch the list, so access checks stay in one place.
 * In-memory only: fine for the single Quarkus replica we run.
 */
@ApplicationScoped
public class BringAlongEvents {
    private record Subscriber(SseEventSink sink, Sse sse) {}

    private final Map<Long, Set<Subscriber>> subscribers = new ConcurrentHashMap<>();

    public void subscribe(Long partyId, SseEventSink sink, Sse sse) {
        Subscriber subscriber = new Subscriber(sink, sse);
        subscribers.computeIfAbsent(partyId, id -> ConcurrentHashMap.newKeySet()).add(subscriber);
        sendChanged(partyId, subscriber);
    }

    void onChanged(@Observes(during = TransactionPhase.AFTER_SUCCESS) BringAlongChanged event) {
        Set<Subscriber> party = subscribers.get(event.partyId());
        if (party == null) return;
        party.forEach(subscriber -> sendChanged(event.partyId(), subscriber));
    }

    @Scheduled(every = "25s")
    void heartbeat() {
        subscribers.forEach((partyId, party) -> party.forEach(subscriber ->
                send(partyId, subscriber, subscriber.sse().newEventBuilder().comment("ping").build())));
    }

    int subscriberCount(Long partyId) {
        Set<Subscriber> party = subscribers.get(partyId);
        return party == null ? 0 : (int) party.stream().filter(s -> !s.sink().isClosed()).count();
    }

    private void sendChanged(Long partyId, Subscriber subscriber) {
        String data = "{\"partyId\":" + partyId + ",\"at\":\"" + Instant.now() + "\"}";
        send(partyId, subscriber, subscriber.sse().newEventBuilder()
                .name("changed").data(data).build());
    }

    private void send(Long partyId, Subscriber subscriber, jakarta.ws.rs.sse.OutboundSseEvent event) {
        SseEventSink sink = subscriber.sink();
        if (sink.isClosed()) {
            remove(partyId, subscriber);
            return;
        }
        synchronized (sink) {
            sink.send(event).whenComplete((ignored, error) -> {
                if (error != null) remove(partyId, subscriber);
            });
        }
    }

    private void remove(Long partyId, Subscriber subscriber) {
        subscribers.computeIfPresent(partyId, (id, party) -> {
            party.remove(subscriber);
            return party.isEmpty() ? null : party;
        });
    }
}
