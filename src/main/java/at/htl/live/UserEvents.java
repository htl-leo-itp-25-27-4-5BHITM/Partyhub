package at.htl.live;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.event.TransactionPhase;
import jakarta.ws.rs.sse.OutboundSseEvent;
import jakarta.ws.rs.sse.Sse;
import jakarta.ws.rs.sse.SseEventSink;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Keeps the open live streams per user and tells them when something they see changed.
 * Events only name the kind of change; clients refetch through the normal endpoints, so access
 * checks stay in one place. In-memory only, like the bring-along stream: fine for the single
 * Quarkus replica we run.
 */
@ApplicationScoped
public class UserEvents {
    private record Subscriber(SseEventSink sink, Sse sse) {}

    private final Map<Long, Set<Subscriber>> subscribers = new ConcurrentHashMap<>();

    public void subscribe(Long userId, SseEventSink sink, Sse sse) {
        Subscriber subscriber = new Subscriber(sink, sse);
        subscribers.computeIfAbsent(userId, id -> ConcurrentHashMap.newKeySet()).add(subscriber);
        // Tells the client the stream is open, so it can rely on it instead of fast polling.
        send(userId, subscriber, sse.newEventBuilder().name("ready").data("{}").build());
    }

    void onChanged(@Observes(during = TransactionPhase.AFTER_SUCCESS) UserChanged event) {
        if (event.userId() == null) return;
        Set<Subscriber> user = subscribers.get(event.userId());
        if (user == null) return;
        String data = "{\"kind\":\"" + event.kind() + "\",\"at\":\"" + Instant.now() + "\"}";
        user.forEach(subscriber -> send(event.userId(), subscriber,
                subscriber.sse().newEventBuilder().name("changed").data(data).build()));
    }

    @Scheduled(every = "25s")
    void heartbeat() {
        subscribers.forEach((userId, user) -> user.forEach(subscriber ->
                send(userId, subscriber, subscriber.sse().newEventBuilder().comment("ping").build())));
    }

    int subscriberCount(Long userId) {
        Set<Subscriber> user = subscribers.get(userId);
        return user == null ? 0 : (int) user.stream().filter(s -> !s.sink().isClosed()).count();
    }

    private void send(Long userId, Subscriber subscriber, OutboundSseEvent event) {
        SseEventSink sink = subscriber.sink();
        if (sink.isClosed()) {
            remove(userId, subscriber);
            return;
        }
        synchronized (sink) {
            sink.send(event).whenComplete((ignored, error) -> {
                if (error != null) remove(userId, subscriber);
            });
        }
    }

    private void remove(Long userId, Subscriber subscriber) {
        subscribers.computeIfPresent(userId, (id, user) -> {
            user.remove(subscriber);
            return user.isEmpty() ? null : user;
        });
    }
}
