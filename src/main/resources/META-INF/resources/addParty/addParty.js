/* Datum css bei jedem Browser gleich zu machen */

document.addEventListener('DOMContentLoaded', () => {
  flatpickr("#time_start", {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true,
    minuteIncrement: 15
  });

  flatpickr("#time_end", {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true,
    minuteIncrement: 15
  });
});

