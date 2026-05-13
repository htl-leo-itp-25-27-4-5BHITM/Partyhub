(function () {
  const RECONNECT_BASE_MS = 1000;
  const RECONNECT_MAX_MS = 30000;

  let ws = null;
  let reconnectTimer = null;
  let reconnectAttempt = 0;
  let intentionalClose = false;
  let userId = null;

  function getUserId() {
    return (
      window.authService?.getCurrentUserId?.() ??
      window.getCurrentUserId?.() ??
      localStorage.getItem("partyhub_user_id") ??
      null
    );
  }

  function connect() {
    userId = getUserId();
    if (!userId) return;

    intentionalClose = false;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const url = protocol + "//" + host + "/ws";

    try {
      ws = new WebSocket(url);
    } catch (e) {
      scheduleReconnect();
      return;
    }

    ws.onopen = function () {
      reconnectAttempt = 0;
      ws.send(JSON.stringify({ type: "auth", userId: Number(userId) }));
    };

    ws.onmessage = function (event) {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (e) {
        console.warn("WebSocket: invalid message", e);
      }
    };

    ws.onclose = function () {
      ws = null;
      if (!intentionalClose) {
        scheduleReconnect();
      }
    };

    ws.onerror = function () {
      // onclose will fire after onerror
    };
  }

  function handleMessage(data) {
    switch (data.type) {
      case "auth_ok":
        console.log("WebSocket: authenticated as user " + userId);
        break;

      case "auth_error":
        console.warn("WebSocket: auth failed — " + (data.message || "unknown reason"));
        intentionalClose = true;
        ws.close();
        break;

      case "ping":
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "pong" }));
        }
        break;

      case "error":
        console.warn("WebSocket: server error — " + (data.message || ""));
        break;

      case "PARTY_CREATED":
        dispatchEvent("party-created", data.party || {});
        break;

      case "PARTY_UPDATED":
        dispatchEvent("party-updated", data.party || {});
        break;

      case "PARTY_MEMBER_JOINED":
        dispatchEvent("party-member-joined", { partyId: data.partyId, user: data.user });
        break;

      case "PARTY_MEMBER_LEFT":
        dispatchEvent("party-member-left", { partyId: data.partyId, userId: data.userId });
        break;

      case "INVITATION_CREATED":
        dispatchEvent("invitation-created", data.invitation || {});
        if (window.__onInvitationCreated) window.__onInvitationCreated(data.invitation || {});
        break;

      case "NOTIFICATION_CREATED":
        dispatchEvent("notification-created", data.notification || {});
        if (window.__onNotificationCreated) window.__onNotificationCreated(data.notification || {});
        break;

      default:
        break;
    }
  }

  function dispatchEvent(name, detail) {
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: detail }));
    } catch (e) {
      console.warn("WebSocket: event dispatch failed for " + name, e);
    }
  }

  function scheduleReconnect() {
    if (intentionalClose) return;
    const delay = Math.min(
      RECONNECT_BASE_MS * Math.pow(2, reconnectAttempt),
      RECONNECT_MAX_MS
    );
    reconnectAttempt++;
    reconnectTimer = setTimeout(connect, delay);
  }

  function disconnect() {
    intentionalClose = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      ws.close();
      ws = null;
    }
  }

  function isConnected() {
    return ws !== null && ws.readyState === WebSocket.OPEN;
  }

  function showToast(message, type) {
    type = type || "info";
    var container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    var toast = document.createElement("div");
    toast.className = "toast " + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 3000);
  }

  function updateBadge(delta) {
    var badge = document.getElementById("notifBadge");
    if (!badge) return;
    var count = parseInt(badge.textContent, 10) || 0;
    count = Math.max(0, count + delta);
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = "";
    } else {
      badge.style.display = "none";
      badge.textContent = "0";
    }
  }

  window.addEventListener("notification-created", function () {
    updateBadge(1);
  });

  window.addEventListener("invitation-created", function (e) {
    updateBadge(1);
    var inv = e.detail || {};
    var name = inv.inviterName || "Someone";
    showToast(name + " invited you to a party", "info");
  });

  document.addEventListener("DOMContentLoaded", function () {
    if (getUserId()) {
      connect();
    }
  });

  window.webSocketService = {
    connect: connect,
    disconnect: disconnect,
    isConnected: isConnected,
    showToast: showToast,
  };
})();
