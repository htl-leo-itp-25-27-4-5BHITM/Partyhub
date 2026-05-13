package at.htl.websocket;

import java.util.Map;

import io.quarkus.logging.Log;
import io.quarkus.websockets.next.OnClose;
import io.quarkus.websockets.next.OnOpen;
import io.quarkus.websockets.next.OnTextMessage;
import io.quarkus.websockets.next.WebSocket;
import io.quarkus.websockets.next.WebSocketConnection;
import jakarta.inject.Inject;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebSocket(path = "/ws")
public class PartyHubWebSocket {

    @Inject
    WebSocketSessionManager sessionManager;

    @Inject
    ObjectMapper objectMapper;

    @OnOpen
    void onOpen() {
        Log.debug("WebSocket connection opened");
    }

    @OnTextMessage
    void onMessage(String message, WebSocketConnection connection) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> data = objectMapper.readValue(message, Map.class);
            String type = (String) data.get("type");

            if (type == null) {
                sendJson(connection, Map.of("type", "error", "message", "Missing message type"));
                return;
            }

            switch (type) {
                case "auth" -> handleAuth(data, connection);
                case "pong" -> { /* heartbeat acknowledged */ }
                default -> {
                    sendJson(connection, Map.of("type", "error", "message", "Unknown message type"));
                }
            }
        } catch (JsonProcessingException e) {
            sendJson(connection, Map.of("type", "error", "message", "Invalid JSON"));
        }
    }

    private void handleAuth(Map<String, Object> data, WebSocketConnection connection) {
        Object userIdObj = data.get("userId");
        if (userIdObj == null) {
            sendJson(connection, Map.of("type", "error", "message", "userId required"));
            return;
        }

        Long userId;
        try {
            userId = ((Number) userIdObj).longValue();
        } catch (ClassCastException e) {
            sendJson(connection, Map.of("type", "error", "message", "userId must be a number"));
            return;
        }

        sessionManager.register(userId, connection);
        sendJson(connection, Map.of("type", "auth_ok"));
        Log.debug("User " + userId + " authenticated via WebSocket");
    }

    @OnClose
    void onClose(WebSocketConnection connection) {
        sessionManager.remove(connection);
        Log.debug("WebSocket connection closed");
    }

    private void sendJson(WebSocketConnection connection, Map<?, ?> data) {
        try {
            String json = objectMapper.writeValueAsString(data);
            connection.sendTextAndAwait(json);
        } catch (Exception e) {
            Log.warn("Failed to send WebSocket message", e);
        }
    }
}
