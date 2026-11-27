# Party wizard navigation verification

Verified locally on 2026-11-27 against origin/main 380ec97 plus this change.

- Circular stage controls are native buttons with stage names, visible keyboard focus and aria-current on the selected button.
- Clicking Basics worked; Enter activated Bring; Tab then Space activated Map.
- Direct navigation reached Bring with an empty form. Create party on Map still rejected the empty form with "Please enter a name for the party."
- Entered a separate browser-local test draft: "Wizard round-trip verification", description "Name, times and address persisted during local browser verification.", start 25.12.2026 20:00, end 26.12.2026 02:00, address "Hauptplatz 1, 4020 Linz, Austria".
- Saved at Details, visited the Drafts list, reopened, and confirmed all five fields and stage 3 were restored. Navigating again changed Saved to Save draft.
- Desktop 1280x800 and mobile 390x844: all five controls fit; mobile document width matched viewport width.
- Original demo draft was preserved. Its initial missing dates/address were expected because those fields had not been entered.
- 41 Node tests passed using node --test scripts/tests/*.test.cjs src/test/js/*.test.cjs. Regression coverage includes all five fields, switching incomplete stages and resaving the selected stage.
- App compiled and ran from this worktree. No backend/security changes; Maven test suite was not run.
- Impeccable detector ran; it reported incumbent styling warnings (including button contrast and card padding). No redesign was attempted.

Local server: JAVA_TOOL_OPTIONS=--add-opens=java.base/java.lang=ALL-UNNAMED with ./mvnw quarkus:dev -Dquarkus.flyway.clean-at-start=false -Dquarkus.flyway.locations=db/migration -Dquarkus.mailer.mock=true. This excludes development seed callbacks and avoids wiping/reseeding the database.

Some preview automation calls reported generic errors; DOM inspection confirmed state. The successful draft save used DOM click; stage click and real keyboard actions were also verified.
