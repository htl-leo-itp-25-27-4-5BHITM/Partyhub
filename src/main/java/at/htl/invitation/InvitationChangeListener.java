package at.htl.invitation;

import at.htl.live.PartyChanged;
import io.quarkus.arc.Arc;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;

/**
 * Reports every stored change of an invitation as a change of its party's guest list, whatever
 * code path made it. Fired during flush inside the write transaction, so live observers only see
 * it after commit.
 */
public class InvitationChangeListener {

    @PostPersist
    @PostUpdate
    @PostRemove
    void changed(Invitation invitation) {
        if (invitation.getParty() == null || invitation.getParty().getId() == null) return;
        Arc.container().beanManager().getEvent()
                .select(PartyChanged.class)
                .fire(new PartyChanged(invitation.getParty().getId()));
    }
}
