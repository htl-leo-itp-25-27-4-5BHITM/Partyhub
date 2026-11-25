/*
 * Target of the links in the e-mail change mails: #token=… confirms the new address,
 * #cancel=… ("This wasn't me") stops the change and leads to the password reset.
 * The token sits in the URL fragment so it never reaches server logs.
 */
// Opening a second link while this page is open only changes the hash; start over with it.
window.addEventListener("hashchange", () => window.location.reload());

document.addEventListener("DOMContentLoaded", async () => {
  const status = document.getElementById("confirmStatus");
  const actions = document.getElementById("confirmActions");
  const params = new URLSearchParams(window.location.hash.slice(1));
  const confirmToken = params.get("token");
  const cancelToken = params.get("cancel");
  history.replaceState(null, "", window.location.pathname);

  function show(message, kind, withActions = true) {
    status.textContent = message;
    status.className = `status-box ${kind || ""}`;
    actions.hidden = !withActions;
  }

  const problems = {
    LINK_EXPIRED: "This link has expired. Request a new one in your settings.",
    LINK_INVALID: "This link is no longer valid. It may have been used already or replaced by a newer one.",
    EMAIL_TAKEN: "This e-mail address is no longer available. Your current address stays active.",
    TEMPORARY_ERROR: "Your e-mail could not be changed right now. Please open the link again later.",
  };

  async function post(path, token) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    let body = null;
    try { body = await response.json(); } catch { body = null; }
    return { response, body };
  }

  if (!confirmToken && !cancelToken) {
    show("This link is incomplete. Open it again from the e-mail.", "error");
    return;
  }

  try {
    if (confirmToken) {
      const { response, body } = await post("/api/email-change/confirm", confirmToken);
      if (response.ok) {
        document.getElementById("newLinkBtn").hidden = true;
        show("Your e-mail address was changed. Use the new address the next time you log in.", "success");
      } else {
        show(problems[body?.code] || "Your e-mail could not be changed.", "error");
      }
      return;
    }
    const { response, body } = await post("/api/email-change/not-me", cancelToken);
    if (response.ok && body?.passwordResetUrl) {
      show("The e-mail change was stopped. Choose a new password now to protect your account.", "success", false);
      setTimeout(() => window.location.replace(body.passwordResetUrl), 2500);
    } else {
      document.getElementById("newLinkBtn").hidden = true;
      show(problems[body?.code] || "This link is no longer valid.", "error");
    }
  } catch {
    show("PartyHub could not be reached. Please try again.", "error");
  }
});
