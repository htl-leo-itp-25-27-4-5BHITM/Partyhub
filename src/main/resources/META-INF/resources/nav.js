const partyHubTranslations = {
    en: {
        "PartyHub – Homepage": "PartyHub - Homepage",
        "Finde deine nächste Party": "Find your next party",
        "Wähle ein Event aus und entdecke die Teilnehmer direkt auf der Karte.": "Select an event and discover attendees directly on the map.",
        "Party auswählen": "Select party",
        "Party auswählen, um Teilnehmende zu sehen": "Select a party to see attendees",
        "Live-Karte": "Live Map",
        "Teilnehmende": "Attendees",
        "Alle Partys": "All Parties",
        "Entdecke tolle Events in deiner Naehe": "Discover great events near you",
        "Neue Party erstellen": "Create New Party",
        "Partys werden geladen...": "Loading parties...",
        "Partys werden geladen...": "Loading parties...",
        "Keine Partys gefunden.": "No parties found.",
        "Fehler beim Laden der Partys. Bitte versuche es erneut.": "Could not load parties. Please try again.",
        "Ort wird noch bekanntgegeben": "Location will be announced",
        "Allgemein": "General",
        "Unbegrenzt": "Unlimited",
        "max. Teilnehmer": "max. attendees",
        "Heute": "Today",
        "Morgen": "Tomorrow",
        "Benachrichtigungen": "Notifications",
        "Immer auf dem Laufenden bei deinen Events": "Stay up to date with your events",
        "Keine Benachrichtigungen": "No notifications",
        "Nachricht": "Message",
        "vor kurzem": "just now",
        "Profilbild": "Profile picture",
        "Party anzeigen": "Show party",
        "Einladung annehmen": "Accept invitation",
        "Annehmen": "Accept",
        "Benachrichtigung löschen": "Delete notification",
        "Löschen": "Delete",
        "Keine Party-Information vorhanden": "No party information available",
        "Follow-Anfrage akzeptiert ✓": "Follow request accepted ✓",
        "Einladung angenommen ✓": "Invitation accepted ✓",
        "Fehler beim Annehmen": "Could not accept",
        "Follow-Anfrage abgelehnt": "Follow request rejected",
        "Einladung abgelehnt": "Invitation rejected",
        "Fehler beim Ablehnen": "Could not reject",
        "hat dich zu": "invited you to",
        "hat": "invited",
        "zu": "to",
        "eingeladen": "",
        "einem Event": "an event",
        "möchte dir folgen": "wants to follow you",
        "Party erstellen": "Create Party",
        "Party bearbeiten": "Edit Party",
        "Wer kann an der Party teilnehmen?": "Who can attend this party?",
        "Weitere Infos": "More Details",
        "Kartenvorschau": "Map Preview",
        "Keine gegenseitigen Follower gefunden.": "No mutual followers found.",
        "Keine User gefunden.": "No users found.",
        "User konnten nicht geladen werden.": "Users could not be loaded.",
        "Freund ausgewählt": "friend selected",
        "Freunde ausgewählt": "friends selected",
        "Bitte gib einen Namen für die Party ein.": "Please enter a name for the party.",
        "Bitte gib eine Beschreibung ein.": "Please enter a description.",
        "Bitte gib eine Startzeit ein.": "Please enter a start time.",
        "Bitte gib eine Endzeit ein.": "Please enter an end time.",
        "Die Endzeit muss nach der Startzeit liegen.": "The end time must be after the start time.",
        "Bitte gib eine Adresse ein.": "Please enter an address.",
        "Du hast keine Personen ausgewählt. Willst du trotzdem fortfahren?": "You have not selected anyone. Do you still want to continue?",
        "Das Mindestalter darf nicht negativ sein.": "The minimum age cannot be negative.",
        "Das maximale Alter darf nicht negativ sein.": "The maximum age cannot be negative.",
        "Das maximale Alter darf nicht kleiner als das Mindestalter sein.": "The maximum age cannot be lower than the minimum age.",
        "Adresse konnte nicht auf der Karte angezeigt werden.": "The address could not be shown on the map.",
        "Kein User angemeldet. Bitte neu einloggen.": "No user is signed in. Please log in again.",
        "Name": "Name",
        "Beschreibung": "Description",
        "Beginn": "Start",
        "Ende": "End",
        "Adresse": "Address",
        "Wer kann diese Party sehen?": "Who can see this party?",
        "Privat": "Private",
        "Nur eingeladene Freunde": "Invited friends only",
        "Öffentlich": "Public",
        "Alle können sehen": "Everyone can see it",
        "Freunde einladen": "Invite friends",
        "Diese Party ist für alle Nutzer sichtbar.": "This party is visible to all users.",
        "Eintritt (€)": "Entry (€)",
        "Motto": "Theme",
        "Mindestalter": "Minimum age",
        "Max. Alter": "Max. age",
        "Website": "Website",
        "Party wird auf der Karte angezeigt": "Party will be shown on the map",
        "Fortschritt beim Party-Erstellen": "Party creation progress",
        "Weiter": "Next",
        "Änderungen speichern": "Save changes",
        "Party beitreten": "Join party",
        "Galerie ansehen": "View gallery",
        "Eingeladene Personen": "Invited people",
        "Party wird geladen...": "Loading party...",
        "Motto": "Theme",
        "Wann": "When",
        "Altersbeschraenkung": "Age restriction",
        "Max. Teilnehmende": "Max. attendees",
        "Zurueck": "Back",
        "Keine Partys vorhanden": "No parties yet",
        "Keine Beiträge vorhanden": "No posts yet",
        "Keine Favoriten vorhanden": "No favorites yet",
        "Beitragstitel": "Post title",
        "Inhalt des Beitrags": "Post content",
        "Favoriten Titel": "Favorite title",
        "Inhalt des Favoriten": "Favorite content",
        "Beiträge": "Posts",
        "Favoriten": "Favorites",
        "Profil": "Profile",
        "Startseite": "Home",
        "Untere Navigation": "Bottom navigation",
        "Sprache umschalten": "Switch language"
    },
    de: {}
};

function getPartyHubLanguage() {
    const lang = localStorage.getItem("partyhub.language") || "de";
    return partyHubTranslations[lang] ? lang : "de";
}

function translateText(value) {
    const lang = getPartyHubLanguage();
    if (lang === "de") return value;

    const trimmed = String(value).trim();
    return partyHubTranslations[lang][trimmed] || value;
}

function applyPartyHubLanguage(root = document.body) {
    const lang = getPartyHubLanguage();
    document.documentElement.lang = lang;
    document.body?.setAttribute("data-language", lang);

    document.querySelectorAll("[aria-label]").forEach((el) => {
        el.setAttribute("aria-label", translateText(el.getAttribute("aria-label")));
    });

    document.querySelectorAll("[title]").forEach((el) => {
        el.setAttribute("title", translateText(el.getAttribute("title")));
    });

    document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach((el) => {
        el.setAttribute("placeholder", translateText(el.getAttribute("placeholder")));
    });

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            const parent = node.parentElement;
            if (!parent || ["SCRIPT", "STYLE", "SVG"].includes(parent.tagName)) {
                return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
        }
    });

    const textNodes = [];
    while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
    }

    textNodes.forEach((node) => {
        const translated = translateText(node.nodeValue);
        if (translated !== node.nodeValue) {
            node.nodeValue = translated;
        }
    });
}

function watchPartyHubLanguage() {
    if (!document.body || getPartyHubLanguage() === "de") return;

    let pending = false;
    const observer = new MutationObserver(() => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
            pending = false;
            applyPartyHubLanguage();
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
}

window.partyHubI18n = {
    get language() {
        return getPartyHubLanguage();
    },
    t: translateText,
    apply: applyPartyHubLanguage
};

function highlightActiveNav() {
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;

    const links = nav.querySelectorAll('.nav-btn');
    const currentPath = window.location.pathname.toLowerCase();

    links.forEach(a => {
        const icon = a.querySelector('.nav-icon');
        if (!icon) return;

        icon.classList.remove('icon--green');
        icon.classList.add('icon--pink');
        a.classList.remove('active');
        a.removeAttribute('aria-current');

        const href = (a.getAttribute('href') || '').toLowerCase();
        if (href.includes('index') && (currentPath === '/' || currentPath.includes('index'))) {
            icon.classList.remove('icon--pink');
            icon.classList.add('icon--green');
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
        } else if (href.includes('listpartys') && currentPath.includes('listpartys')) {
            icon.classList.remove('icon--pink');
            icon.classList.add('icon--green');
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
        } else if (href.includes('notifications') && currentPath.includes('notifications')) {
            icon.classList.remove('icon--pink');
            icon.classList.add('icon--green');
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
        } else if (href.includes('profile') && currentPath.includes('profile')) {
            icon.classList.remove('icon--pink');
            icon.classList.add('icon--green');
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        applyPartyHubLanguage();
        highlightActiveNav();
        watchPartyHubLanguage();
    });
} else {
    applyPartyHubLanguage();
    highlightActiveNav();
    watchPartyHubLanguage();
}
