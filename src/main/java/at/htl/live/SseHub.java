package at.htl.live;

import jakarta.ws.rs.sse.OutboundSseEvent;
import jakarta.ws.rs.sse.Sse;
import jakarta.ws.rs.sse.SseEventSink;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Open server-sent-event streams grouped by a key (user id, party id). Sends named events with a
 * small JSON payload, drops closed streams, and sends heartbeat comments. In-memory only: fine for
 * the single Quarkus replica we run.
 */
final class SseHub<K> {
    private record Subscriber(SseEventSink sink, Sse sse) {}

    private final Map<K, Set<Subscriber>> subscribers = new ConcurrentHashMap<>();

    void subscribe(K key, SseEventSink sink, Sse sse, String firstEventName) {
        Subscriber subscriber = new Subscriber(sink, sse);
        subscribers.computeIfAbsent(key, k -> ConcurrentHashMap.newKeySet()).add(subscriber);
        send(key, subscriber, sse.newEventBuilder().name(firstEventName).data("{}").build());
    }

    void broadcast(K key, String eventName, String data) {
        Set<Subscriber> group = subscribers.get(key);
        if (group == null) return;
        group.forEach(subscriber -> send(key, subscriber,
                subscriber.sse().newEventBuilder().name(eventName).data(data).build()));
    }

    void heartbeat() {
        subscribers.forEach((key, group) -> group.forEach(subscriber ->
                send(key, subscriber, subscriber.sse().newEventBuilder().comment("ping").build())));
    }

    int count(K key) {
        Set<Subscriber> group = subscribers.get(key);
        return group == null ? 0 : (int) group.stream().filter(s -> !s.sink().isClosed()).count();
    }

    private void send(K key, Subscriber subscriber, OutboundSseEvent event) {
        SseEventSink sink = subscriber.sink();
        if (sink.isClosed()) {
            remove(key, subscriber);
            return;
        }
        synchronized (sink) {
            sink.send(event).whenComplete((ignored, error) -> {
                if (error != null) remove(key, subscriber);
            });
        }
    }

    private void remove(K key, Subscriber subscriber) {
        subscribers.computeIfPresent(key, (k, group) -> {
            group.remove(subscriber);
            return group.isEmpty() ? null : group;
        });
    }
}
