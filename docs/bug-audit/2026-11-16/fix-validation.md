# Browser audit fixes

Branch: `fix/browser-audit-bugs`.

Published findings: [#181](https://github.com/htl-leo-itp-25-27-4-5BHITM/Partyhub/issues/181), [#182](https://github.com/htl-leo-itp-25-27-4-5BHITM/Partyhub/issues/182), [#183](https://github.com/htl-leo-itp-25-27-4-5BHITM/Partyhub/issues/183).

## Automated checks

Run the dependency-free frontend regression checks with:

```sh
node --test scripts/tests/*.test.cjs
```

The geolocation checks execute the homepage script with a simulated browser location service and map. They cover a real coordinate supplied outside Leonding, permission denial, an unsupported service, watch ID zero, cleanup and restoration through browser history.

The relative-date checks execute the party detail script using fixed dates in Europe/Vienna. They cover the reported two-day discrepancy, short durations, midnight, 24/48-hour boundaries, and spring/fall daylight-saving changes.

## Local browser checks

The changed frontend was served on localhost with isolated, synthetic read-only API fixtures. These checks do not exercise Quarkus, authentication, production media, or the live database.

- Homepage: browser `watchPosition` remains native; the fake-location restoration function is absent and no fabricated user marker appears when no position is supplied.
- Party detail: the original fixed-date example returns `in 2 days`; an event on the next calendar date at a 24-hour difference returns `tomorrow`.

- Gallery at 390×844 and 1280×800: Tab reaches photo buttons; Enter and Space open the viewer; focus starts on Close; Shift+Tab and Tab wrap inside the dialog; Escape closes it and restores thumbnail focus. ArrowRight changes the image. Pointer opening also focuses Close.
- Gallery edge cases: rerendering the grid restores focus to the replacement opener, a one-photo gallery hides both navigation arrows, and delete controls remain siblings of photo buttons (no nested buttons). Deletion requests were not exercised.
- Integration fixes: removed the visibility transition that prevented immediate modal focus, retained mobile navigation arrows, and explicitly hide arrows for one-photo galleries.

All seven Node regression checks, JavaScript syntax checks, and whitespace checks passed. These changes have not been deployed.
