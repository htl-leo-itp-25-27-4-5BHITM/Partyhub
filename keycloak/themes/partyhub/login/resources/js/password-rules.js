/* Live feedback for the password rules on the "Update password" page. */
(function () {
  var form = document.getElementById("kc-passwd-update-form");
  if (!form) return;
  var input = document.getElementById("password-new");
  var confirm = document.getElementById("password-confirm");
  var username = (form.getAttribute("data-username") || "").toLowerCase();

  function mark(rule, ok) {
    var item = form.querySelector('[data-rule="' + rule + '"]');
    if (!item) return;
    item.classList.toggle("ph-rule-ok", ok);
    item.classList.toggle("ph-rule-open", !ok);
  }

  function update() {
    var value = input.value;
    mark("length", value.length >= 8);
    mark("username", value.length > 0 && (!username || value.toLowerCase() !== username));
    mark("match", value.length > 0 && value === confirm.value);
  }

  input.addEventListener("input", update);
  confirm.addEventListener("input", update);
  update();
})();
