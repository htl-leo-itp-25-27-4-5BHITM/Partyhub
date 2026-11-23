/* Private, account-scoped draft persistence. Each draft has its own storage key. */
(function () {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const object = value => value !== null && typeof value === "object" && !Array.isArray(value);

  function validateSnapshot(value) {
    if (!object(value) || !object(value.fields) ||
        !Object.values(value.fields).every(field => typeof field === "string") ||
        !Array.isArray(value.selectedUsers) ||
        !value.selectedUsers.every(id => typeof id === "string" || (typeof id === "number" && Number.isFinite(id))) ||
        !Number.isInteger(value.step) || value.step < 1 || value.step > 5 ||
        !["private", "public"].includes(value.visibility)) {
      throw new Error("Invalid party draft data");
    }
    for (const [name, maximum] of [["latitude", 90], ["longitude", 180]]) {
      if (value[name] != null && (!Number.isFinite(value[name]) || Math.abs(value[name]) > maximum)) {
        throw new Error("Invalid party draft coordinates");
      }
    }
    if (value.bringAlong != null && (!object(value.bringAlong) || !Array.isArray(value.bringAlong.items))) {
      throw new Error("Invalid party draft bring-along list");
    }
    return value;
  }

  class UnreadableDraftError extends Error {}

  function forUser(userId) {
    if (userId == null || String(userId).trim() === "") throw new Error("A signed-in account is required");
    const prefix = `partyhub:party-draft:v2:${encodeURIComponent(String(userId))}:`;
    const legacyKey = `partyhub:party-draft:v1:${userId}`;
    const storage = () => window.localStorage;
    const keyFor = id => {
      if (typeof id !== "string" || !UUID.test(id)) throw new Error("Invalid draft ID");
      return prefix + id;
    };

    function parseRecord(raw, key) {
      try {
        const draft = JSON.parse(raw);
        validateSnapshot(draft);
        if (draft.version !== 2 || keyFor(draft.id) !== key ||
            typeof draft.updatedAt !== "string" || !Number.isFinite(Date.parse(draft.updatedAt))) {
          throw new Error("Invalid saved party draft");
        }
        return draft;
      } catch {
        throw new UnreadableDraftError("A saved party draft could not be read");
      }
    }

    function parseLegacy(raw) {
      try {
        const draft = JSON.parse(raw);
        if (draft?.version !== 1) throw new Error("Unsupported older party draft");
        return validateSnapshot(draft);
      } catch {
        throw new UnreadableDraftError("The older party draft could not be read");
      }
    }

    function read(key) {
      const raw = storage().getItem(key);
      return raw === null ? null : parseRecord(raw, key);
    }

    function keys() {
      const result = [];
      for (let i = 0; i < storage().length; i++) {
        const key = storage().key(i);
        if (key?.startsWith(prefix) && UUID.test(key.slice(prefix.length))) result.push(key);
      }
      return result;
    }

    function write(snapshot, id, migratedFrom) {
      validateSnapshot(snapshot);
      const draft = {
        version: 2, id, updatedAt: new Date().toISOString(),
        fields: snapshot.fields, step: snapshot.step, visibility: snapshot.visibility,
        selectedUsers: snapshot.selectedUsers,
        latitude: snapshot.latitude ?? null, longitude: snapshot.longitude ?? null,
        bringAlong: snapshot.bringAlong ?? null,
        ...(migratedFrom ? { migratedFrom } : {}),
      };
      // Serialization happens before mutation; a rejected write preserves previous bytes.
      const raw = JSON.stringify(draft);
      storage().setItem(keyFor(id), raw);
      return JSON.parse(raw);
    }

    function migrateLegacy(records) {
      const raw = storage().getItem(legacyKey);
      if (raw === null) return null;
      const legacy = parseLegacy(raw);
      // If cleanup failed before, use the already persisted record rather than duplicate it.
      const migrated = records.find(draft => draft.migratedFrom === legacyKey);
      const created = migrated ? null : write(legacy, window.crypto.randomUUID(), legacyKey);
      storage().removeItem(legacyKey);
      return created;
    }

    return {
      list() {
        const records = [];
        const unreadable = [];
        for (const key of keys()) {
          try {
            const record = read(key);
            if (record) records.push(record);
          } catch (error) {
            if (!(error instanceof UnreadableDraftError)) throw error;
            unreadable.push({ id: key.slice(prefix.length) });
          }
        }
        try {
          const migrated = migrateLegacy(records);
          if (migrated) records.push(migrated);
        } catch (error) {
          if (!(error instanceof UnreadableDraftError)) throw error;
          unreadable.push({ id: "legacy" });
        }
        records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
        records.unreadable = unreadable;
        return records;
      },
      get(id) {
        return read(keyFor(id));
      },
      save(snapshot, id = null) {
        // A new party never depends on reading or repairing unrelated drafts.
        if (id === null) return write(snapshot, window.crypto.randomUUID());
        const key = keyFor(id);
        const previous = read(key);
        if (!previous) throw new Error("This party draft no longer exists");
        return write(snapshot, id, previous.migratedFrom);
      },
      remove(id) {
        // Delete only the requested draft; unrelated malformed records do not block it.
        storage().removeItem(keyFor(id));
      },
      removeUnreadable(id) {
        const key = id === "legacy" ? legacyKey : keyFor(id);
        const raw = storage().getItem(key);
        if (raw === null) return false;
        try {
          if (id === "legacy") parseLegacy(raw);
          else parseRecord(raw, key);
          return false; // Another tab may have recovered this record since it was listed.
        } catch (error) {
          if (!(error instanceof UnreadableDraftError)) throw error;
          if (storage().getItem(key) !== raw) return false;
          storage().removeItem(key);
          return true;
        }
      },
    };
  }

  window.PartyDrafts = { forUser };
})();
