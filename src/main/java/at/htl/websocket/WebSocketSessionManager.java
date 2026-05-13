package at.htl.websocket;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import io.quarkus.logging.Log;
import io.quarkus.websockets.next.WebSocketConnection;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class WebSocketSessionManager {

    private final ConcurrentHashMap<Long, Set<WebSocketConnection>> connectionsByUser = new ConcurrentHashMap<>();

    public void register(Long userId, WebSocketConnection connection) {
        connectionsByUser.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(connection);
    }

    public void remove(WebSocketConnection connection) {
        connectionsByUser.forEach((userId, connections) -> connections.remove(connection));
    }

    public void remove(Long userId, WebSocketConnection connection) {
        Set<WebSocketConnection> connections = connectionsByUser.get(userId);
        if (connections != null) {
            connections.remove(connection);
            if (connections.isEmpty()) {
                connectionsByUser.remove(userId);
            }
        }
    }

    public void broadcastToUser(Long userId, String message) {
        Set<WebSocketConnection> connections = connectionsByUser.get(userId);
        if (connections != null) {
            for (WebSocketConnection conn : connections) {
                try {
                    conn.sendTextAndAwait(message);
                } catch (Exception e) {
                    Log.warn("WebSocket send failed, removing connection", e);
                    remove(userId, conn);
                }
            }
        }
    }

    public void broadcastToUsers(Set<Long> userIds, String message) {
        for (Long userId : userIds) {
            broadcastToUser(userId, message);
        }
    }
}
