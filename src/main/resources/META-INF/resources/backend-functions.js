function getUserIdFromStorage() {
  return window.getCurrentUserId?.() ?? null;
}

// Party-functions
async function createParty(payload) {
  const userId = getUserIdFromStorage();
  if (!userId) {
    return { ok: false, error: "User not logged in" };
  }

  try {
    const response = await fetch(`/api/parties?user=${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 201 || response.ok) {
      return {
        ok: true,
        status: response.status,
        data: await response.json().catch(() => null)
      };
    } else {
      return {
        ok: false,
        status: response.status,
        text: await response.text().catch(() => null)
      };
    }
  } catch (error) {
    return { ok: false, error };
  }
}

async function getAllParties() {
  try {
    const response = await fetch("/api/parties");
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Error fetching parties:", error);
    return null;
  }
}

async function sortParties(sortKey) {
  try {
    const response = await fetch(`/api/parties?sort=${sortKey}`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Error fetching sorted parties:", error);
    return null;
  }
}

async function filterParties(content) {
  const filterPayload = { value: content };
  try {
    const response = await fetch("/api/parties?q=" + encodeURIComponent(content), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(filterPayload)
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Error filtering parties:", error);
    return null;
  }
}

async function getPartyById(partyId) {
  try {
    const response = await fetch(`/api/parties/${partyId}`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Error fetching party by ID:", error);
    return null;
  }
}

async function updateParty(partyId, payload) {
  try {
    const response = await fetch(`/api/party/${partyId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Error updating party:", error);
    return null;
  }
}

async function deleteParty(partyId) {
  try {
    const response = await fetch(`/api/parties/${partyId}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Network response was not ok");
    return { ok: true };
  } catch (error) {
    console.error("Error deleting party:", error);
    return { ok: false, error };
  }
}

async function attendParty(partyId) {
  const userId = getUserIdFromStorage();
  if (!userId) {
    console.error("User not logged in");
    return false;
  }
  try {
    const response = await fetch(`/api/parties/${partyId}/join?user=${userId}`, {
      method: "POST"
    });
    return response.ok;
  } catch (error) {
    console.error("Error attending the party:", error);
    return false;
  }
}

async function leaveParty(partyId) {
  const userId = getUserIdFromStorage();
  if (!userId) {
    console.error("User not logged in");
    return false;
  }
  try {
    const response = await fetch(`/api/parties/${partyId}/join?user=${userId}`, {
      method: "DELETE"
    });
    return response.ok;
  } catch (error) {
    console.error("Error leaving the party:", error);
    return false;
  }
}

async function getMediaForParty(partyId) {
  try {
    const response = await fetch(`/api/parties/${partyId}/media`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Error fetching party media:", error);
    return null;
  }
}

// User-functions
async function getAllUsers() {
  try {
    const response = await fetch("/api/users/");
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    return null;
  }
}

async function getUserById(id) {
  try {
    const response = await fetch("/api/users/" + id);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

function getProfilePictureUrl(id) {
  return `/api/users/${id}/profile-picture`;
}

async function getProfilePicture(id) {
  return `/api/users/${id}/profile-picture`;
}

async function invite(recipient, partyId) {
  const userId = getUserIdFromStorage();
  if (!userId) {
    return { ok: false, error: "User not logged in" };
  }

  const invitationPayload = { recipient, partyId };

  try {
    const response = await fetch(`/api/invitations?user=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invitationPayload)
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return { ok: true };
  } catch (error) {
    console.error("Error during invitation:", error);
    return { ok: false, error };
  }
}

async function getReceivedInvites() {
  const userId = getUserIdFromStorage();
  if (!userId) {
    console.error("User not logged in");
    return [];
  }

  try {
    const response = await fetch(`/api/invitations?user=${userId}&direction=received`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Error fetching received invitation:", error);
    return null;
  }
}

async function getSentInvites() {
  const userId = getUserIdFromStorage();
  if (!userId) {
    console.error("User not logged in");
    return [];
  }

  try {
    const response = await fetch(`/api/invitations?user=${userId}&direction=sent`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Error fetching sent invitation:", error);
    return null;
  }
}

async function deleteInvite(invitationId) {
  const userId = getUserIdFromStorage();
  if (!userId) {
    console.error("User not logged in");
    return { ok: false, error: "User not logged in" };
  }

  try {
    const response = await fetch(`/api/invitations/${invitationId}?user=${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Invitation not found");
      }
      throw new Error(`Failed to delete invitation: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Error deleting invitation:", error);
    throw error;
  }
}

function normalizePartyArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.parties)) return data.parties;
  return [];
}

async function getPartiesByUser(userId) {
  try {
    const raw = await getAllParties();
    const all = normalizePartyArray(raw);

    if (!Array.isArray(all)) return [];

    const id = String(userId);

    const result = all.filter((p) => {
      if (!p) return false;

      if (p.host_user_id != null && String(p.host_user_id) === id) return true;
      if (p.hostId != null && String(p.hostId) === id) return true;
      if (p.host_id != null && String(p.host_id) === id) return true;
      if (p.hostUserId != null && String(p.hostUserId) === id) return true;
      if (p.ownerId != null && String(p.ownerId) === id) return true;
      if (p.creatorId != null && String(p.creatorId) === id) return true;
      if (p.userId != null && String(p.userId) === id) return true;
      if (p.owner != null && String(p.owner) === id) return true;
      if (p.user != null && String(p.user) === id) return true;
      if (p.creator != null && String(p.creator) === id) return true;

      if (p.host && typeof p.host === "object") {
        if (p.host.id != null && String(p.host.id) === id) return true;
        if (p.host.userId != null && String(p.host.userId) === id) return true;
      }

      if (p.host_user && typeof p.host_user === "object") {
        if (p.host_user.id != null && String(p.host_user.id) === id) return true;
        if (p.host_user.userId != null && String(p.host_user.userId) === id) return true;
      }

      if (p.ownerUser && typeof p.ownerUser === "object") {
        if (p.ownerUser.id != null && String(p.ownerUser.id) === id) return true;
      }

      if (p.creatorUser && typeof p.creatorUser === "object") {
        if (p.creatorUser.id != null && String(p.creatorUser.id) === id) return true;
      }

      return false;
    });

    return result;
  } catch (err) {
    console.error("getPartiesByUser failed", err);
    return [];
  }
}

// Follow helpers
async function getFollowers(userId) {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(userId)}/followers`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("getFollowers failed", err);
    return [];
  }
}

async function getFollowings(userId) {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(userId)}/following`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("getFollowings failed", err);
    return [];
  }
}

async function isFollowing(userA, userB) {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(userA)}/following/${encodeURIComponent(userB)}`);
    if (!res.ok) return false;

    const data = await res.json();

    if (typeof data === "boolean") return data;
    if (typeof data?.following === "boolean") return data.following;
    if (typeof data?.isFollowing === "boolean") return data.isFollowing;
    if (typeof data?.result === "boolean") return data.result;

    return Boolean(data);
  } catch (err) {
    console.error("isFollowing failed", err);
    return false;
  }
}

async function followUser(targetUserId) {
  const userId = getUserIdFromStorage();
  if (!userId) return { ok: false, error: "Not logged in" };

  try {
    const alreadyFollowing = await isFollowing(userId, targetUserId);
    if (alreadyFollowing) {
      return { ok: true, status: 200, alreadyFollowing: true };
    }

    const res = await fetch(`/api/users/${encodeURIComponent(userId)}/follow/${encodeURIComponent(targetUserId)}`, {
      method: "POST"
    });

    if (res.ok) {
      return { ok: true, status: res.status };
    }

    if (res.status === 409) {
      return { ok: true, status: 409, alreadyFollowing: true };
    }

    return { ok: false, status: res.status, text: await res.text().catch(() => null) };
  } catch (err) {
    console.error("followUser failed", err);
    return { ok: false, error: err };
  }
}

async function unfollowUser(targetUserId) {
  const userId = getUserIdFromStorage();
  if (!userId) return { ok: false, error: "Not logged in" };

  try {
    const currentlyFollowing = await isFollowing(userId, targetUserId);
    if (!currentlyFollowing) {
      return { ok: true, status: 200, alreadyNotFollowing: true };
    }

    const res = await fetch(`/api/users/${encodeURIComponent(userId)}/follow/${encodeURIComponent(targetUserId)}`, {
      method: "DELETE"
    });

    if (res.ok) {
      return { ok: true, status: res.status };
    }

    if (res.status === 404 || res.status === 409) {
      return { ok: true, status: res.status, alreadyNotFollowing: true };
    }

    return { ok: false, status: res.status, text: await res.text().catch(() => null) };
  } catch (err) {
    console.error("unfollowUser failed", err);
    return { ok: false, error: err };
  }
}

// --- NEW: unified follow-status helper ---
async function getFollowStatus(userA, userB) {
  // self-check
  if (userA == null || userB == null) return { status: "not_following" };
  if (String(userA) === String(userB)) return { status: "self" };

  try {
    // first check direct follow relationship
    const following = await isFollowing(userA, userB);
    if (following) return { status: "following" };

    // fallback: check pending lists for userB (users who requested to follow userB)
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userB)}/followers?status=pending`);
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (Array.isArray(data) && data.some((u) => String(u?.id) === String(userA))) {
          return { status: "pending" };
        }
      }
    } catch (err) {
      // ignore, return not_following below
    }

    return { status: "not_following" };
  } catch (err) {
    console.error("getFollowStatus failed", err);
    return { status: "not_following" };
  }
}

window.backend = {
  createParty,
  getAllParties,
  sortParties,
  filterParties,
  getPartyById,
  getPartiesByUser,
  updateParty,
  deleteParty,
  attendParty,
  leaveParty,
  getMediaForParty,
  getAllUsers,
  getUserById,
  getProfilePicture,
  invite,
  getReceivedInvites,
  getSentInvites,
  deleteInvite,
  getFollowers,
  getFollowings,
  isFollowing,
  getFollowStatus,
  followUser,
  unfollowUser
};