(function () {
  function website(value) {
    if (typeof value !== "string" || /[\u0000-\u0020\u007f]/.test(value)) return null;
    try {
      if (!/^https?:\/\//i.test(value)) return null;
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) && url.hostname && !url.username && !url.password ? url.href : null;
    } catch { return null; }
  }
  window.inputSafety = Object.freeze({ website });
})();
