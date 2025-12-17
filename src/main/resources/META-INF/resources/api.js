// Reusable API helpers to call backend endpoints from frontend
// Attach to window.partyApi so pages can call partyApi.attendParty(...) etc.

(function () {
  async function attendParty(partyId, userId = null) {
    if (!partyId) throw new Error('partyId is required');
    const headers = {};
    if (userId) headers['X-User-Id'] = userId;
    try {
      const res = await fetch(`/api/party/${partyId}/attend`, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Attend failed: ${res.status} ${text}`);
      }
      return await res.json().catch(() => ({}));
    } catch (err) {
      console.error('attendParty error', err);
      throw err;
    }
  }

  async function unattendParty(partyId, userId = null) {
    if (!partyId) throw new Error('partyId is required');
    const headers = {};
    if (userId) headers['X-User-Id'] = userId;
    try {
      const res = await fetch(`/api/party/${partyId}/attend`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Unattend failed: ${res.status} ${text}`);
      }
      return await res.json().catch(() => ({}));
    } catch (err) {
      console.error('unattendParty error', err);
      throw err;
    }
  }

  async function attendStatus(partyId) {
    if (!partyId) throw new Error('partyId is required');
    try {
      const res = await fetch(`/api/party/${partyId}/attend/status`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Status fetch failed: ${res.status} ${text}`);
      }
      return await res.json();
    } catch (err) {
      console.error('attendStatus error', err);
      throw err;
    }
  }

  // Convenience toggle: calls attend or unattend based on current status
  async function toggleAttend(partyId, userId = null) {
    const status = await attendStatus(partyId).catch(() => ({ attending: false }));
    if (status.attending) {
      return unattendParty(partyId, userId);
    } else {
      return attendParty(partyId, userId);
    }
  }

  window.partyApi = {
    attendParty,
    unattendParty,
    attendStatus,
    toggleAttend
  };
})();

