// Bring-along list on the party detail page.
// The list stays live: the server pushes "changed" signals over SSE and the page refetches.
// If the stream is down, the page polls every 4 s while it is visible.

(function () {
  const POLL_MS = 4000; // stays under the 5 s freshness target incl. request time
  const REFRESH_DEBOUNCE_MS = 300;
  const MAX_BACKOFF_MS = 30000;

  const state = {
    partyId: null,
    items: [],
    isHost: false,
    isMember: false,
    userId: null,
    drafts: new Map(), // input key -> unsent value
    errors: new Map(), // item id -> message
    editingItemId: null,
    loading: false,
    reloadQueued: false,
    stream: null, // AbortController of the open stream
    backoffMs: 2000,
    reconnectTimer: null,
    pollTimer: null,
    refreshTimer: null,
    live: false,
  };

  document.addEventListener("DOMContentLoaded", () => {
    state.partyId = new URLSearchParams(window.location.search).get("id");
    if (!state.partyId || !document.getElementById("bring-along-section")) {
      return;
    }
    setupAddForm();
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && state.isMember) {
        reload();
      }
    });
    window.addEventListener("pagehide", stopLive);
    reload();
  });

  // Called by the join/leave button after membership changed.
  window.bringAlong = { reload };

  function base() {
    return `/api/parties/${encodeURIComponent(state.partyId)}/bring-along`;
  }

  // ---------- Loading ----------

  async function reload() {
    if (state.loading) {
      state.reloadQueued = true;
      return;
    }
    state.loading = true;
    try {
      await load();
    } finally {
      state.loading = false;
      if (state.reloadQueued) {
        state.reloadQueued = false;
        reload();
      }
    }
  }

  function scheduleRefresh() {
    clearTimeout(state.refreshTimer);
    state.refreshTimer = setTimeout(reload, REFRESH_DEBOUNCE_MS);
  }

  async function load() {
    if (!window.authService?.isLoggedIn?.()) {
      setMember(false);
      showHint("Log in and join the party to see what to bring.");
      return;
    }

    let response;
    try {
      response = await window.authService.apiCall(base());
    } catch (error) {
      console.warn("Bring-along list could not be loaded:", error);
      return; // keep the last state; polling or the stream will retry
    }

    if (response.status === 403) {
      setMember(false);
      showHint("Join the party to see the bring-along list.");
      return;
    }
    if (response.status === 404) {
      setMember(false);
      showHint("This party is no longer available.");
      return;
    }
    if (!response.ok) {
      console.warn("Bring-along list request failed:", response.status);
      return;
    }

    state.items = await response.json();
    if (!state.isMember) {
      state.userId = Number(await currentUserId());
      state.isHost = await checkHost();
      setMember(true);
    }
    render();
  }

  async function currentUserId() {
    try {
      const user = await window.authService.getCurrentUser();
      return user?.id ?? window.authService.getCurrentUserId?.();
    } catch (error) {
      return window.authService.getCurrentUserId?.();
    }
  }

  async function checkHost() {
    try {
      const response = await window.authService.apiCall(
        `/api/parties/${encodeURIComponent(state.partyId)}/can-edit`
      );
      return response.ok && (await response.json()).canEdit === true;
    } catch (error) {
      return false;
    }
  }

  function setMember(isMember) {
    const changed = state.isMember !== isMember;
    state.isMember = isMember;
    if (!isMember) {
      state.isHost = false;
      state.items = [];
    }
    document.getElementById("bring-along-add").hidden = !(isMember && state.isHost);
    if (changed) {
      if (isMember) {
        startLive();
      } else {
        stopLive();
      }
    }
  }

  // ---------- Live updates ----------

  function startLive() {
    stopLive();
    connectStream();
  }

  function stopLive() {
    state.stream?.abort();
    state.stream = null;
    clearTimeout(state.reconnectTimer);
    stopPolling();
    setLiveIndicator(false, false);
  }

  async function connectStream() {
    const controller = new AbortController();
    state.stream = controller;
    try {
      const response = await window.authService.apiCall(`${base()}/events`, {
        headers: { Accept: "text/event-stream" },
        signal: controller.signal,
      });
      if (response.status === 403 || response.status === 404) {
        reload(); // membership changed; load() shows the right hint
        return;
      }
      if (!response.ok || !response.body) {
        throw new Error(`Stream status ${response.status}`);
      }

      state.backoffMs = 2000;
      stopPolling();
      setLiveIndicator(true, true);

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        buffer += value;
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop();
        if (blocks.some((block) => /^event:\s*changed\s*$/m.test(block))) {
          scheduleRefresh();
        }
      }
      throw new Error("Stream closed");
    } catch (error) {
      if (controller.signal.aborted || state.stream !== controller) {
        return; // stopped on purpose
      }
      console.warn("Bring-along live connection lost, falling back to polling:", error.message);
      setLiveIndicator(false, true);
      startPolling();
      state.reconnectTimer = setTimeout(() => {
        if (state.isMember && state.stream === controller) {
          connectStream();
        }
      }, state.backoffMs);
      state.backoffMs = Math.min(state.backoffMs * 2, MAX_BACKOFF_MS);
    }
  }

  function startPolling() {
    if (state.pollTimer) {
      return;
    }
    reload();
    state.pollTimer = setInterval(() => {
      if (!document.hidden) {
        reload();
      }
    }, POLL_MS);
  }

  function stopPolling() {
    clearInterval(state.pollTimer);
    state.pollTimer = null;
  }

  function setLiveIndicator(live, visible) {
    const indicator = document.getElementById("bring-along-live");
    if (!indicator) {
      return;
    }
    indicator.hidden = !visible;
    indicator.classList.toggle("is-live", live);
    indicator.textContent = live ? "Live" : "Reconnecting…";
  }

  // ---------- Rendering ----------

  function showHint(text) {
    const list = document.getElementById("bring-along-list");
    const hint = document.getElementById("bring-along-hint");
    list.replaceChildren();
    hint.textContent = text;
    hint.hidden = false;
  }

  function render() {
    const list = document.getElementById("bring-along-list");
    const hint = document.getElementById("bring-along-hint");
    const focus = captureFocus();

    if (!state.items.length) {
      list.replaceChildren();
      hint.textContent = state.isHost
        ? "Nothing on the list yet. Add what your guests should bring."
        : "The host hasn't added anything to bring yet.";
      hint.hidden = false;
    } else {
      hint.hidden = true;
      list.replaceChildren(...state.items.map(renderItem));
    }
    restoreFocus(focus);
  }

  function renderItem(item) {
    const li = el("li", "ba-item");
    li.dataset.itemId = item.id;
    li.classList.toggle("is-fulfilled", item.fulfilled);

    if (state.editingItemId === item.id) {
      li.append(renderEditForm(item));
      appendError(li, item.id);
      return li;
    }

    const own = item.pledges.find((pledge) => pledge.userId === state.userId);
    const unit = item.unit ? ` ${decode(item.unit)}` : "";

    const head = el("div", "ba-item-head");
    const check = el("span", "ba-check");
    check.setAttribute("aria-hidden", "true");
    check.innerHTML =
      '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const name = el("span", "ba-name", decode(item.name));
    const count = el("span", "ba-count", `${item.pledged} / ${item.quantity}${unit}`);
    if (item.fulfilled) {
      count.setAttribute("aria-label", `${item.pledged} of ${item.quantity}${unit}, covered`);
    }
    head.append(check, name, count);
    li.append(head);

    const progress = el("div", "ba-progress");
    const bar = el("div", "ba-progress-bar");
    bar.style.width = `${Math.min(100, Math.round((item.pledged / item.quantity) * 100))}%`;
    progress.append(bar);
    li.append(progress);

    if (item.pledges.length) {
      const pledgers = el("ul", "ba-pledgers");
      for (const pledge of item.pledges) {
        const isMe = pledge.userId === state.userId;
        const entry = el("li", isMe ? "ba-pledger is-me" : "ba-pledger");
        entry.append(
          el("span", "ba-pledger-name", isMe ? "You" : decode(pledge.displayName)),
          el("span", "ba-pledger-qty", `${pledge.quantity}${unit}`)
        );
        pledgers.append(entry);
      }
      li.append(pledgers);
    }

    li.append(renderPledgeControls(item, own));
    if (state.isHost) {
      li.append(renderHostControls(item));
    }
    appendError(li, item.id);
    return li;
  }

  function renderPledgeControls(item, own) {
    const controls = el("div", "ba-pledge");
    const maxForMe = item.remaining + (own?.quantity ?? 0);

    if (maxForMe <= 0) {
      controls.append(el("span", "ba-covered", "Covered – nothing more needed"));
      return controls;
    }

    const key = `pledge-${item.id}`;
    const input = el("input", "ba-input");
    input.type = "number";
    input.inputMode = "numeric";
    input.min = "1";
    input.step = "1";
    input.max = String(maxForMe);
    input.dataset.focusKey = key;
    input.setAttribute("aria-label", `How many ${decode(item.name)} you bring`);
    input.value = state.drafts.get(key) ?? String(own?.quantity ?? Math.min(1, maxForMe));
    input.addEventListener("input", () => {
      state.drafts.set(key, input.value);
      input.classList.remove("is-invalid");
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        submitPledge(item, input, maxForMe);
      }
    });

    const save = el("button", "ba-btn ba-btn-primary", own ? "Update" : "I'll bring");
    save.type = "button";
    save.addEventListener("click", () => submitPledge(item, input, maxForMe));

    controls.append(input, el("span", "ba-max", `max ${maxForMe}`), save);

    if (own) {
      const withdraw = el("button", "ba-btn ba-btn-ghost", "Withdraw");
      withdraw.type = "button";
      withdraw.addEventListener("click", () => withdrawPledge(item));
      controls.append(withdraw);
    }
    return controls;
  }

  function renderHostControls(item) {
    const controls = el("div", "ba-host");
    const edit = el("button", "ba-link", "Edit");
    edit.type = "button";
    edit.addEventListener("click", () => {
      state.editingItemId = item.id;
      state.drafts.set(`edit-name-${item.id}`, decode(item.name));
      state.drafts.set(`edit-qty-${item.id}`, String(item.quantity));
      state.drafts.set(`edit-unit-${item.id}`, item.unit ? decode(item.unit) : "");
      render();
    });
    const remove = el("button", "ba-link ba-link-danger", "Delete");
    remove.type = "button";
    remove.addEventListener("click", () => deleteItem(item));
    controls.append(edit, remove);
    return controls;
  }

  function renderEditForm(item) {
    const form = el("div", "ba-edit");
    const name = draftInput(`edit-name-${item.id}`, "text", "Item", 100);
    const qty = draftInput(`edit-qty-${item.id}`, "number", "Qty");
    qty.min = "1";
    qty.max = "10000";
    qty.step = "1";
    qty.inputMode = "numeric";
    const unit = draftInput(`edit-unit-${item.id}`, "text", "Unit", 30);

    const save = el("button", "ba-btn ba-btn-primary", "Save");
    save.type = "button";
    save.addEventListener("click", () => saveItem(item, name, qty, unit));
    const cancel = el("button", "ba-btn ba-btn-ghost", "Cancel");
    cancel.type = "button";
    cancel.addEventListener("click", () => {
      state.editingItemId = null;
      state.errors.delete(item.id);
      render();
    });
    form.append(name, qty, unit, save, cancel);
    return form;
  }

  function draftInput(key, type, placeholder, maxLength) {
    const input = el("input", "ba-input");
    input.type = type;
    input.placeholder = placeholder;
    input.setAttribute("aria-label", placeholder);
    if (maxLength) {
      input.maxLength = maxLength;
    }
    input.dataset.focusKey = key;
    input.value = state.drafts.get(key) ?? "";
    input.addEventListener("input", () => {
      state.drafts.set(key, input.value);
      input.classList.remove("is-invalid");
    });
    return input;
  }

  function appendError(li, itemId) {
    const message = state.errors.get(itemId);
    const error = el("p", "ba-error", message || "");
    error.setAttribute("role", "alert");
    li.append(error);
  }

  // ---------- Actions ----------

  async function submitPledge(item, input, maxForMe) {
    const quantity = parseWholeNumber(input.value);
    if (quantity === null || quantity < 1) {
      return invalid(item.id, input, "Enter a whole number of at least 1.");
    }
    if (quantity > maxForMe) {
      return invalid(
        item.id,
        input,
        maxForMe === 1 ? "Only 1 is still needed." : `Only ${maxForMe} are still needed.`
      );
    }

    const response = await send(`${base()}/items/${item.id}/pledge`, "PUT", { quantity });
    if (!response) {
      return;
    }
    if (response.status === 409) {
      const body = await response.json().catch(() => ({}));
      const remaining = Number(body.remaining ?? 0);
      state.drafts.delete(`pledge-${item.id}`);
      showItemError(
        item.id,
        remaining === 0
          ? "Someone was faster – this item is already covered."
          : `Too many – only ${remaining} still needed.`
      );
      return reload();
    }
    if (!response.ok) {
      return showItemError(item.id, await errorMessage(response));
    }
    state.drafts.delete(`pledge-${item.id}`);
    state.errors.delete(item.id);
    await reload();
  }

  async function withdrawPledge(item) {
    const response = await send(`${base()}/items/${item.id}/pledge`, "DELETE");
    if (!response) {
      return;
    }
    if (!response.ok) {
      return showItemError(item.id, await errorMessage(response));
    }
    state.drafts.delete(`pledge-${item.id}`);
    state.errors.delete(item.id);
    await reload();
  }

  async function saveItem(item, nameInput, qtyInput, unitInput) {
    const body = readItemForm(item.id, nameInput, qtyInput, unitInput);
    if (!body) {
      return;
    }
    const response = await send(`${base()}/items/${item.id}`, "PUT", body);
    if (!response) {
      return;
    }
    if (!response.ok) {
      return showItemError(item.id, await errorMessage(response));
    }
    state.editingItemId = null;
    ["name", "qty", "unit"].forEach((field) => state.drafts.delete(`edit-${field}-${item.id}`));
    state.errors.delete(item.id);
    await reload();
  }

  async function deleteItem(item) {
    const name = decode(item.name);
    const warning = item.pledges.length
      ? `Delete "${name}"? ${item.pledges.length} pledge(s) will be removed too.`
      : `Delete "${name}"?`;
    if (!window.confirm(warning)) {
      return;
    }
    const response = await send(`${base()}/items/${item.id}`, "DELETE");
    if (!response) {
      return;
    }
    if (!response.ok && response.status !== 404) {
      return showItemError(item.id, await errorMessage(response));
    }
    await reload();
  }

  function setupAddForm() {
    const form = document.getElementById("bring-along-add");
    if (!form) {
      return;
    }
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const nameInput = form.elements.namedItem("name");
      const qtyInput = form.elements.namedItem("quantity");
      const unitInput = form.elements.namedItem("unit");
      const error = document.getElementById("bring-along-add-error");
      error.textContent = "";

      const body = readItemForm(null, nameInput, qtyInput, unitInput, (message) => {
        error.textContent = message;
      });
      if (!body) {
        return;
      }
      const submit = form.querySelector("button[type=submit]");
      submit.disabled = true;
      try {
        const response = await send(`${base()}/items`, "POST", body);
        if (!response) {
          return;
        }
        if (!response.ok) {
          error.textContent = await errorMessage(response);
          return;
        }
        form.reset();
        qtyInput.value = "1";
        nameInput.focus();
        await reload();
      } finally {
        submit.disabled = false;
      }
    });
  }

  function readItemForm(itemId, nameInput, qtyInput, unitInput, report) {
    const fail = (input, message) => {
      input.classList.add("is-invalid");
      if (report) {
        report(message);
      } else {
        showItemError(itemId, message);
      }
      return null;
    };
    const name = nameInput.value.trim();
    if (!name) {
      return fail(nameInput, "Enter what should be brought.");
    }
    const quantity = parseWholeNumber(qtyInput.value);
    if (quantity === null || quantity < 1 || quantity > 10000) {
      return fail(qtyInput, "Quantity must be a whole number from 1 to 10000.");
    }
    const unit = unitInput.value.trim();
    return { name, quantity, unit: unit || null };
  }

  async function send(url, method, body) {
    try {
      return await window.authService.apiCall(url, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (error) {
      console.error("Bring-along request failed:", error);
      alert("Connection problem – please try again.");
      return null;
    }
  }

  async function errorMessage(response) {
    if (response.status === 403) {
      reload();
      return "You can't change this anymore.";
    }
    const body = await response.json().catch(() => null);
    return (
      body?.violations?.[0]?.message ||
      body?.error ||
      (response.status === 400 ? "Please check your input." : "Something went wrong – please try again.")
    );
  }

  function invalid(itemId, input, message) {
    input.classList.add("is-invalid");
    showItemError(itemId, message);
  }

  function showItemError(itemId, message) {
    state.errors.set(itemId, message);
    const li = document.querySelector(`.ba-item[data-item-id="${itemId}"]`);
    const slot = li?.querySelector(".ba-error");
    if (slot) {
      slot.textContent = message;
      li.classList.remove("shake");
      void li.offsetWidth; // restart the animation
      li.classList.add("shake");
      li.addEventListener("animationend", () => li.classList.remove("shake"), { once: true });
    }
    // Errors fade out on their own so stale messages don't stick around.
    setTimeout(() => {
      if (state.errors.get(itemId) === message) {
        state.errors.delete(itemId);
        const current = document.querySelector(`.ba-item[data-item-id="${itemId}"] .ba-error`);
        if (current) {
          current.textContent = "";
        }
      }
    }, 6000);
  }

  // ---------- Helpers ----------

  function parseWholeNumber(raw) {
    const value = String(raw ?? "").trim();
    return /^\d+$/.test(value) ? Number(value) : null;
  }

  function captureFocus() {
    const active = document.activeElement;
    if (!active?.dataset?.focusKey || !active.closest("#bring-along-list")) {
      return null;
    }
    let selection = null;
    try {
      selection = [active.selectionStart, active.selectionEnd];
    } catch (error) {
      // number inputs don't expose a selection
    }
    return { key: active.dataset.focusKey, selection };
  }

  function restoreFocus(focus) {
    if (!focus) {
      return;
    }
    const input = document.querySelector(`#bring-along-list [data-focus-key="${focus.key}"]`);
    if (!input) {
      return;
    }
    input.focus();
    try {
      if (focus.selection) {
        input.setSelectionRange(focus.selection[0], focus.selection[1]);
      }
    } catch (error) {
      // ignore for number inputs
    }
  }

  // The API HTML-encodes user text; decode it and render with textContent only.
  function decode(text) {
    const area = document.createElement("textarea");
    area.innerHTML = text ?? "";
    return area.value;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text !== undefined) {
      node.textContent = text;
    }
    return node;
  }
})();
