# Design

## Decisions
1. **Unfollow endpoint semantics:** the path already names both sides (`{id}` followed, `{followerId}` follower). The caller must be one of them; the repository call is always `removeFollow(followerId, id)`. Existing callers already pass these values (profile unfollow: target/followers/me; notifications decline: me/followers/requester), so no client change is needed; declining starts working.
2. **Own status endpoint** instead of reading the target's inbox: `GET /{id}/follow-status` answers from the caller's own row only; blocked counts as `none`.
3. **Net counting:** after the 24-hour rule and the range filter, group by follower; first and last remaining entry decide: F…F → gained (at last entry), U…U → lost (at last entry), otherwise nothing. Replaces the per-person counting from #215.
