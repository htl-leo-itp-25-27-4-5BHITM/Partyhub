// Bring-along list on the party detail page.
// The list stays live: the server pushes "changed" signals over SSE and the page refetches.
// If the stream is down, the page polls every 4 s while it is visible.
// Visitors of a public party (logged out or not joined) get a read-only list without names
// and no live stream; it refreshes when the tab becomes visible again.

(function () {
  const POLL_MS = 4000; // stays under the 5 s freshness target incl. request time
  const REFRESH_DEBOUNCE_MS = 300;
  const MAX_BACKOFF_MS = 30000;

  const state = {
    partyId: null,
    items: [],
    isHost: false,
    isMember: false,
    readOnly: false, // anonymised list of a public party for non-members
    userId: null,
    drafts: new Map(), // input key -> unsent value
    errors: new Map(), // item id -> message
    editingItemId: null,
    pendingPledges: new Set(),
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
    const toggle = document.getElementById("bring-along-toggle");
    const panel = document.getElementById("bring-along-section");
    toggle.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      toggle.setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) reload();
    });
    setupAddForm();
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && (state.isMember || state.readOnly)) {
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
    const loggedIn = Boolean(window.authService?.isLoggedIn?.());

    let response;
    try {
      response = loggedIn ? await window.authService.apiCall(base()) : await fetch(base());
    } catch (error) {
      console.warn("Bring-along list could not be loaded:", error);
      return; // keep the last state; polling or the stream will retry
    }

    if (response.status === 401) {
      setMember(false);
      showHint("Log in and join the party to see what to bring.");
      return;
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

    const items = await response.json();
    if (!loggedIn || !(await isMemberList(items))) {
      setMember(false);
      state.readOnly = true;
      state.items = items;
      render();
      return;
    }

    state.readOnly = false;
    state.items = items;
    if (!state.isMember) {
      state.userId = Number(await currentUserId());
      state.isHost = await checkHost();
      setMember(true);
    }
    render();
  }

  // Members get pledges with every item; non-members of a public party get none.
  // An empty list carries no such signal, so ask the server directly.
  async function isMemberList(items) {
    if (items.length) {
      return Array.isArray(items[0].pledges);
    }
    try {
      const response = await window.authService.apiCall(
        `/api/parties/${encodeURIComponent(state.partyId)}/join/status`
      );
      if (response.ok && (await response.json()).attending === true) {
        return true;
      }
    } catch (error) {
      // fall through to the host check
    }
    return checkHost();
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
    state.readOnly = false;
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
    indicator.hidden = !visible || live;
    indicator.classList.toggle("is-live", live);
    indicator.textContent = "Reconnecting…";
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

    if (state.readOnly) {
      list.replaceChildren(...state.items.map(renderReadOnlyItem));
      hint.textContent = !state.items.length
        ? "The host hasn't added anything to bring yet."
        : window.authService?.isLoggedIn?.()
          ? "Join the party to pledge what you bring."
          : "Log in and join the party to pledge what you bring.";
      hint.hidden = false;
    } else if (!state.items.length) {
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

    const row = el("div", "ba-item-row");
    const info = el("div", "ba-item-info");
    const availability = item.fulfilled ? "All covered" : `${item.remaining}${unit} still needed`;
    info.append(
      el("span", "ba-name", decode(item.name)),
      el("span", "ba-availability", availability),
      el("span", "ba-total", `${item.quantity}${unit} needed in total`)
    );
    row.append(info, renderPledgeControls(item, own));
    li.append(row);

    const otherPledges = item.pledges.filter((pledge) => pledge.userId !== state.userId);
    if (otherPledges.length) {
      const pledgers = el("ul", "ba-pledgers");
      for (const pledge of otherPledges) {
        const entry = el("li", "ba-pledger");
        entry.append(
          el("span", "ba-pledger-name", decode(pledge.displayName)),
          el("span", "ba-pledger-qty", `${pledge.quantity}${unit}`)
        );
        pledgers.append(entry);
      }
      li.append(pledgers);
    }

    if (state.isHost) {
      li.append(renderHostControls(item));
    }
    appendError(li, item.id);
    return li;
  }

  // Visitors see totals only: no names, no pledge or host controls.
  function renderReadOnlyItem(item) {
    const li = el("li", "ba-item");
    li.dataset.itemId = item.id;
    li.classList.toggle("is-fulfilled", item.fulfilled);
    const unit = item.unit ? ` ${decode(item.unit)}` : "";
    const info = el("div", "ba-item-info");
    info.append(
      el("span", "ba-name", decode(item.name)),
      el("span", "ba-availability", item.fulfilled ? "All covered" : `${item.remaining}${unit} still needed`),
      el("span", "ba-total", `${item.pledged} / ${item.quantity}${unit}`)
    );
    const row = el("div", "ba-item-row");
    row.append(info);
    li.append(row);
    return li;
  }

  function renderPledgeControls(item, own) {
    const controls = el("div", "ba-pledge");
    const quantity = own?.quantity ?? 0;
    const name = decode(item.name);
    const pending = state.pendingPledges.has(item.id);
    const minus = el("button", "ba-btn ba-btn-ghost", "−");
    const plus = el("button", "ba-btn ba-btn-primary", "+");
    for (const button of [minus, plus]) button.type = "button";
    minus.dataset.focusKey = `pledge-minus-${item.id}`;
    plus.dataset.focusKey = `pledge-plus-${item.id}`;
    minus.setAttribute("aria-label", `Bring one less: ${name}`);
    plus.setAttribute("aria-label", `Bring one more: ${name}`);
    minus.disabled = pending || quantity === 0;
    plus.disabled = pending || item.remaining <= 0;
    minus.addEventListener("click", () => changePledge(item, quantity - 1));
    plus.addEventListener("click", () => changePledge(item, quantity + 1));
    const stepper = el("div", "ba-stepper");
    stepper.append(minus, el("span", "ba-own-quantity", String(quantity)), plus);
    controls.append(el("span", "ba-stepper-label", "You bring"), stepper);
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

  async function changePledge(item, quantity) {
    if (state.pendingPledges.has(item.id)) return;
    const focus = captureFocus();
    state.pendingPledges.add(item.id);
    render();
    try {
      const url = `${base()}/items/${item.id}/pledge`;
      const response = quantity === 0 ? await send(url, "DELETE") : await send(url, "PUT", { quantity });
      if (!response) return;
      if (response.status === 409) {
        showItemError(item.id, "The available quantity changed. Check the updated list.");
        await reload();
        return;
      }
      if (!response.ok) {
        showItemError(item.id, await errorMessage(response));
        return;
      }
      state.errors.delete(item.id);
      await reload();
    } finally {
      state.pendingPledges.delete(item.id);
      const active = document.activeElement;
      render();
      if (active === document.body) restoreFocus(focus);
    }
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
