package at.htl.bringalong;

/** CDI event fired inside a write transaction; observers only see it after commit. */
public record BringAlongChanged(Long partyId) {}
