// "Bring-along" step of the add/edit party wizard.
// Items are only staged here; apply(partyId) stores them after the party itself was saved,
// so leaving the wizard without saving never changes the stored list.

(function () {
  const items = []; // { id?, name, quantity, unit, pledged, status: existing|new|changed|removed }
  let editingIndex = null;
  let els = null;

  function init() {
    els = {
      list: document.getElementById("baStepList"),
      empty: document.getElementById("baStepEmpty"),
      name: document.getElementById("baStepName"),
      quantity: document.getElementById("baStepQuantity"),
      unit: document.getElementById("baStepUnit"),
      add: document.getElementById("baStepAdd"),
      cancel: document.getElementById("baStepCancel"),
      error: document.getElementById("baStepError"),
    };
    if (!els.list) {
      return;
    }
    els.add.addEventListener("click", submitForm);
    els.cancel.addEventListener("click", resetForm);
    [els.name, els.quantity, els.unit].forEach((input) => {
      input.addEventListener("input", () => {
        input.classList.remove("is-invalid");
        els.error.textContent = "";
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          submitForm();
        }
      });
    });
    render();
  }

  async function load(partyId) {
    try {
      const response = await window.authService.apiCall(
        `/api/parties/${encodeURIComponent(partyId)}/bring-along`
      );
      if (!response.ok) {
        console.warn("Bring-along items could not be loaded:", response.status);
        return;
      }
      const loaded = await response.json();
      items.length = 0;
      for (const item of loaded) {
        items.push({
          id: item.id,
          name: decode(item.name),
          quantity: item.quantity,
          unit: item.unit ? decode(item.unit) : "",
          pledged: item.pledged,
          pledgeCount: item.pledges.length,
          status: "existing",
        });
      }
      render();
    } catch (error) {
      console.warn("Bring-along items could not be loaded:", error);
    }
  }

  // Blocks "Continue" while the item form holds text that was not added yet.
  function validate() {
    const pending = els && (els.name.value.trim() || els.unit.value.trim());
    if (pending) {
      showError(
        editingIndex === null
          ? "Click “Add” to put this item on the list, or clear the fields."
          : "Save or cancel the item you are editing first."
      );
      return false;
    }
    return true;
  }

  function hasChanges() {
    return items.some((item) => item.status !== "existing");
  }

  // Stores staged changes; resolves to the names of items that could not be saved.
  async function apply(partyId) {
    const base = `/api/parties/${encodeURIComponent(partyId)}/bring-along/items`;
    const failed = [];
    for (const item of items) {
      if (item.status === "existing" || (item.status === "removed" && !item.id)) {
        continue;
      }
      const body = JSON.stringify({ name: item.name, quantity: item.quantity, unit: item.unit || null });
      let request;
      if (item.status === "removed") {
        request = { url: `${base}/${item.id}`, method: "DELETE" };
      } else if (item.status === "changed" && item.id) {
        request = { url: `${base}/${item.id}`, method: "PUT", body };
      } else {
        request = { url: base, method: "POST", body };
      }
      try {
        const response = await window.authService.apiCall(request.url, {
          method: request.method,
          body: request.body,
        });
        const ok = response.ok || (item.status === "removed" && response.status === 404);
        if (!ok) {
          failed.push(item.name);
        }
      } catch (error) {
        console.error("Bring-along item could not be saved:", error);
        failed.push(item.name);
      }
    }
    return failed;
  }

  function submitForm() {
    const name = els.name.value.trim();
    const rawQuantity = els.quantity.value.trim();
    const unit = els.unit.value.trim();

    if (!name) {
      return invalid(els.name, "Enter what guests should bring.");
    }
    if (name.length > 100) {
      return invalid(els.name, "The name can be at most 100 characters.");
    }
    if (!/^\d+$/.test(rawQuantity) || Number(rawQuantity) < 1 || Number(rawQuantity) > 10000) {
      return invalid(els.quantity, "Quantity must be a whole number from 1 to 10000.");
    }
    if (unit.length > 30) {
      return invalid(els.unit, "The unit can be at most 30 characters.");
    }
    if (/[<>]/.test(name) || /[<>]/.test(unit)) {
      return invalid(/[<>]/.test(name) ? els.name : els.unit, "Please don't use < or >.");
    }

    const quantity = Number(rawQuantity);
    if (editingIndex === null) {
      items.push({ name, quantity, unit, pledged: 0, pledgeCount: 0, status: "new" });
    } else {
      const item = items[editingIndex];
      Object.assign(item, { name, quantity, unit });
      if (item.status === "existing") {
        item.status = "changed";
      }
    }
    resetForm();
    els.name.focus();
  }

  function startEdit(index) {
    const item = items[index];
    editingIndex = index;
    els.name.value = item.name;
    els.quantity.value = String(item.quantity);
    els.unit.value = item.unit;
    els.add.textContent = "Save item";
    els.cancel.hidden = false;
    els.error.textContent = "";
    render();
    els.name.focus();
  }

  function remove(index) {
    const item = items[index];
    if (item.pledgeCount > 0) {
      const ok = window.confirm(
        `Remove “${item.name}”? ${item.pledgeCount} guest pledge(s) (${item.pledged} in total) will be removed too.`
      );
      if (!ok) {
        return;
      }
    }
    if (editingIndex === index) {
      resetForm();
    }
    if (item.id) {
      item.status = "removed";
    } else {
      items.splice(index, 1);
    }
    render();
  }

  function resetForm() {
    editingIndex = null;
    els.name.value = "";
    els.quantity.value = "1";
    els.unit.value = "";
    els.add.textContent = "Add";
    els.cancel.hidden = true;
    els.error.textContent = "";
    [els.name, els.quantity, els.unit].forEach((input) => input.classList.remove("is-invalid"));
    render();
  }

  function render() {
    if (!els?.list) {
      return; // load() may finish before init(); init() renders the items then
    }
    const visible = items.map((item, index) => ({ item, index })).filter(({ item }) => item.status !== "removed");
    els.empty.hidden = visible.length > 0;
    els.list.replaceChildren(
      ...visible.map(({ item, index }) => {
        const li = document.createElement("li");
        li.className = "ba-step-item";
        li.classList.toggle("is-editing", editingIndex === index);

        const text = document.createElement("div");
        text.className = "ba-step-text";
        const name = document.createElement("span");
        name.className = "ba-step-name";
        name.textContent = item.name;
        const amount = document.createElement("span");
        amount.className = "ba-step-amount";
        amount.textContent = `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`;
        text.append(name, amount);
        if (item.pledged > 0) {
          const pledged = document.createElement("span");
          pledged.className = "ba-step-pledged";
          pledged.textContent = `${item.pledged} pledged`;
          text.append(pledged);
        }

        const actions = document.createElement("div");
        actions.className = "ba-step-actions";
        const edit = button("Edit", () => startEdit(index));
        edit.setAttribute("aria-label", `Edit ${item.name}`);
        const del = button("Remove", () => remove(index), "is-danger");
        del.setAttribute("aria-label", `Remove ${item.name}`);
        actions.append(edit, del);

        li.append(text, actions);
        return li;
      })
    );
  }

  function button(label, onClick, extraClass) {
    const node = document.createElement("button");
    node.type = "button";
    node.className = `ba-step-link${extraClass ? ` ${extraClass}` : ""}`;
    node.textContent = label;
    node.addEventListener("click", onClick);
    return node;
  }

  function invalid(input, message) {
    input.classList.add("is-invalid");
    input.focus();
    showError(message);
  }

  function showError(message) {
    els.error.textContent = message;
  }

  // The API HTML-encodes user text; decode it and render with textContent only.
  function decode(text) {
    const area = document.createElement("textarea");
    area.innerHTML = text ?? "";
    return area.value;
  }

  document.addEventListener("DOMContentLoaded", init);
  window.BringAlongStep = { load, validate, apply, hasChanges };
})();
