/* Share the own profile link: native share dialog when available, otherwise copy it. */
document.addEventListener("DOMContentLoaded", async () => {
  const user = await window.settings.ready();
  if (!user) return;

  const link = `${window.location.origin}/profile/profile.html?handle=${encodeURIComponent(user.distinctName)}`;
  document.getElementById("profileLink").textContent = link;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      window.settings.toast("Link copied");
    } catch {
      window.settings.toast("The link could not be copied. Select it above and copy it yourself.", { error: true });
    }
  }

  document.getElementById("copyBtn").addEventListener("click", copy);
  document.getElementById("shareBtn").addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${user.displayName || user.distinctName} on PartyHub`, url: link });
      } catch (error) {
        if (error?.name !== "AbortError") copy();
      }
      return;
    }
    copy();
  });
});
