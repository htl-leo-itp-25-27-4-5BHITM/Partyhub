document.addEventListener("DOMContentLoaded", function () {
  const invitedSection = document.querySelector(".invited-section");
  const toggle =
    invitedSection && invitedSection.querySelector(".invited-toggle");
  const list = invitedSection && invitedSection.querySelector(".invited-list");

  if (toggle && invitedSection) {
    toggle.addEventListener("click", function () {
      invitedSection.classList.toggle("open");
      if (list)
        list.setAttribute(
          "aria-hidden",
          invitedSection.classList.contains("open") ? "false" : "true"
        );
    });
  }

  const photosBtn = document.querySelector(".photos-btn");
  if (photosBtn) {
    photosBtn.addEventListener("click", function () {
      // placeholder action: scroll to photos (if there is a photos area in the page)
      const photosSection = document.querySelector(".photos-section");
      if (photosSection) photosSection.scrollIntoView({ behavior: "smooth" });
      else alert("Photos action");
    });
  }
});
