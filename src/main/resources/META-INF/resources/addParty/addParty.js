// Extra JS Datei – nur hier dein JS-Code
document.addEventListener("DOMContentLoaded", () => {
  console.log("Flatpickr Typ:", typeof flatpickr); // Debug in Konsole

  flatpickr("#time_start", {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true,
    minuteIncrement: 15,
  });

  flatpickr("#time_end", {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true,
    minuteIncrement: 15,
  });
});
