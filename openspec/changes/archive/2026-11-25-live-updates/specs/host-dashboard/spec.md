# Spec Delta

## ADDED Requirements

### Requirement: Dashboard refreshes while open
The browser dashboard SHALL update the shown range without a page reload when the host's follow relationships or the attendance of their parties change, and SHALL keep the selected range and metric. Without a live stream it SHALL re-check at least once per minute while visible.

#### Scenario: Guest joins while the dashboard is open
- **WHEN** a guest joins one of the host's parties while the host views the dashboard
- **THEN** the joins figure SHALL update without the host reloading the page
