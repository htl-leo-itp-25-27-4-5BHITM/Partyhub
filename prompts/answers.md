Questions To Decide

1. Should the home map’s “next 14 days” filter be a real product requirement, or just current implementation detail?

2. Should live attendee/current-user location remain part of the product as optional behavior, or should the core specs exclude it?

3. For gallery uploads: should upload be allowed only after the party end time, or is “after the party” only a UX expectation?

4. Who may upload gallery photos: host only, attendees only, invited/accepted users, or anyone who can view the party?

5. For private party invites: should the backend also enforce “mutual contacts only,” or is frontend filtering enough?

6. Does an accepted follow request create a one-way follow, where “mutual contact” requires two accepted relationships, or does acceptance create a mutual relationship automatically?

7. On profiles, should users see all parties created by another user, only public parties, or only parties visible under the same access rules as the map/detail page?

8. During Keycloak migration, should legacy X-User-Id/query-param identity remain temporarily for compatibility?

9. The Keycloak realm has the frontend redirect URI as http://localhost:8000/*, but Keycloak itself is exposed on port 8000. Should the frontend redirect URI instead point to the app URL, likely http://localhost:8080/*?

---

1. just implementation detail
2. exclude 
3. photos can be uploaded at any time
4. all who can see the party
5. backend enforces
6. one way follow
7. only public partys and only those to which the user was invited
8. i dont care, not nessesary
9. allow all for now