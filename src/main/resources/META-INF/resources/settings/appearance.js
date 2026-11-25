/* Light / Dark / System. Applies immediately and stores the choice on the account. */
document.addEventListener("DOMContentLoaded", async () => {
  const user = await window.settings.ready();
  if (!user) return;

  const radios = [...document.querySelectorAll('input[name="theme"]')];
  const select = (theme) => radios.forEach((radio) => { radio.checked = radio.value === theme; });
  select(window.partyhubTheme.get());
  // The stored account value may differ from the cached one shown first.
  window.partyhubTheme.syncFromServer().then((settings) => settings && select(settings.theme));
  window.addEventListener("partyhub:themechange", (event) => select(event.detail.theme));

  let saving = Promise.resolve();
  radios.forEach((radio) => radio.addEventListener("change", () => {
    if (!radio.checked) return;
    saving = saving.then(() => window.partyhubTheme.save(radio.value).catch(() => {
      select(window.partyhubTheme.get());
      window.settings.toast("Could not save the appearance. Please try again.", { error: true });
    }));
  }));
});
