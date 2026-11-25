package at.htl.live;

/**
 * CDI event fired inside a write transaction when a party's guest list changed (someone joined or
 * left, an invitation was created, answered or withdrawn); observers only see it after commit.
 */
public record PartyChanged(Long partyId) {}
