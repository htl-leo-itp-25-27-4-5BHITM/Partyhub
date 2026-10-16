# Design

## Context

Count of `Response` usages per repository (`grep -c Response`): party 39, invitation 31, media 18, notification 12, follow 11, user 6, location 3. Repository tests in `src/test/java/at/htl/repository/` currently assert on `Response.getStatus()`. The HTTP tests in `api/*.http` (run by `./run-http-tests.sh`, or `cd api && npm test`) pin the wire contract.

## Goals / Non-Goals

**Goals:** HTTP concerns only in resources, and identical wire behaviour.

**Non-Goals:** fixing access-control or status-code bugs found along the way. Those go into their own `fix:` change or PR so that a refactor PR never changes behaviour. Record them in `docs/cleanup-audit.md` instead.

## Decisions

- **Result shape:** use `Optional<T>` for "maybe missing". For operations with several failure reasons (for example, joining a party: not found, already joined, full), use a small sealed interface per domain, `sealed interface JoinResult permits Joined, NotFound, AlreadyJoined, Full`, which the resource maps with a `switch`. Alternative: domain exceptions plus `ExceptionMapper`. That's less explicit at the call site, and a forgotten mapper changes statuses silently.
- **Error bodies:** keep each existing body byte-for-byte equivalent JSON (`Map.of("error", "...")`). Clients parse `error`.
- **Split `PartyRepository`:** extract `PartyAttendanceRepository` (join, leave, joined members, status) and `PartyInvitationService` (invited members, stats, notification side effects). `PartyRepository` keeps CRUD, visibility and filtering.
- **Package rename last.** It's a mechanical IDE rename (`mcp__idea__rename_refactoring` if available), done as its own PR so the diff is pure moves.
- **Tests first per domain:** before refactoring a domain, make sure its HTTP tests cover each status the repository can produce. Add the missing `.http` cases in the same PR, then move repository tests from `Response` asserts to result asserts.

## Risks / Trade-offs

- [A status or body changes without anyone noticing] → the HTTP tests must pass unchanged. Run them before and after each PR and diff the results.
- [Merge conflicts with the fix changes] → do this change last (see proposal).
