I’m not ready to write a clean functional spec yet without inventing behavior, because `docs/intent.md` and the brownfield implementation diverge in a few important places.

What the code clearly supports today:
- Party discovery on a map and party detail navigation are implemented on the main page and detail page ([index.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/index.js:344), [advancedPartyInfos.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/advancedPartyInfos/advancedPartyInfos.js:104)).
- Party creation, editing, deletion, privacy, and invite sending are implemented in the backend ([PartyRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyRepository.java:89), [PartyRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyRepository.java:136), [PartyRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyRepository.java:193)).
- User search and a follow system exist, but it is a follow-request workflow, not a simple immediate follow as the narrative suggests ([UserResource.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/user/UserResource.java:311), [UserResource.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/user/UserResource.java:328), [FollowRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/follow/FollowRepository.java:74)).
- Notification center behavior exists for invitations and follow requests ([NotificationResource.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/notification/NotificationResource.java:20), [notifications.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/notifications/notifications.js:758)).
- Gallery viewing exists, and backend media upload exists, but I did not find a gallery upload UI in the current frontend ([gallery.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/gallery/gallery.js:25), [PartyResource.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/party/PartyResource.java:210)).

Main mismatches or ambiguities:
- Authentication: current frontend explicitly says “no Keycloak” and stores a user ID in browser storage ([auth-service.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/auth-service.js:83), [auth-service.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/auth-service.js:154)). That conflicts with the repo’s broader Keycloak direction.
- Invitation acceptance: I found decline behavior, but no equally explicit “accept invitation sets invitation to ACCEPTED” endpoint. The current UX may be treating “join party” as acceptance, which is not the same thing functionally ([InvitationRepository.java](/Users/carla/Documents/Partyhub/src/main/java/at/htl/invitation/InvitationRepository.java:109)).
- Home map: the app now shows parties from the backend, but also includes attendee location features and fake geolocation logic that are not mentioned in `docs/intent.md` ([index.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/index.js:344), [index.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/index.js:395), [index.js](/Users/carla/Documents/Partyhub/src/main/resources/META-INF/resources/index.js:518)).
- Gallery scope: intent says users can upload photos after the party; current gallery page is view-only.

Questions I need answered before I can write the spec without assumptions:
1. Should the functional specification describe the intended target product from `docs/intent.md`, the current brownfield behavior, or both with a “gap” section?
2. For authentication, should the spec describe the current browser-based user-ID login, or the future Keycloak-based flow?
3. When a user “follows” someone, is that supposed to be instant follow, or is the current follow-request/accept model the intended behavior?
4. When a party invitation is accepted, should that be a dedicated invitation state change to `ACCEPTED`, or is joining the party the intended acceptance action?
5. Should the gallery in the functional spec include photo upload from the UI, or only browsing existing photos for now?
6. Should the home map show only nearby parties, all visible parties, or also attendee/live user locations?
7. For private party invitations, should users be selectable from all users, only mutual contacts, or only followers/following?

Once you answer those, I can turn this into a proper Codex-ready functional specification document.


1. it should describe both
2. it should use the future keykloak-based flow
3. 


1. Both: describe the current brownfield behavior and add a “Gap / Target Behavior” section based on docs/intent.md.
2. Describe the current browser-based user-ID login, with Keycloak as the planned future flow.
3. The follow-request/accept model is the intended behavior.
4. Accepting an invitation should happen through joining/attending the party, and that should set the invitation state to ACCEPTED.
5. The gallery spec should include UI photo upload if it exists or is planned, but clearly separate what already works today.
6. The home map should show visible parties; nearby filtering and live attendee/user locations should be separate extended/optional behavior.
7. Private party invitations should only allow mutual contacts, meaning users who follow each other.