document.addEventListener('DOMContentLoaded', function () {
    const img = document.getElementById('profileImg');
    if (!img) return;

    // 1. ID aus der URL holen
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id') || "1";

    // 2. Den Pfad RELATIV zum Root bauen
    // Das "/" am Anfang ist entscheidend! Es springt von
    // ...cloud.../profile/ auf ...cloud.../ zurück.
    const finalPath = `/images/profile_picture${userId}.jpg`;

    console.log("Anfrage geht an: " + finalPath);

    // 3. Den alten Pfad (profile.jpeg) überschreiben
    img.src = finalPath;

    // 4. Fehler-Check
    img.onerror = function() {
        console.error("Bild nicht gefunden unter: " + this.src);
        // Falls das Bild fehlt, lade das Standardbild vom Root-Pfad
        this.src = "/images/profile_picture1.jpg";
    };
});