package at.htl.bringalong;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class BringAlongService {
    @Inject EntityManager em;
    @Inject Event<BringAlongChanged> changed;

    /** Frees everything a user pledged for a party, e.g. when they leave it. */
    @Transactional
    public void removePledgesOf(Long partyId, Long userId) {
        int removed = em.createQuery("delete from BringAlongPledge p where p.user.id = :userId and p.item.id in "
                        + "(select i.id from BringAlongItem i where i.party.id = :partyId)")
                .setParameter("userId", userId).setParameter("partyId", partyId).executeUpdate();
        if (removed > 0) changed.fire(new BringAlongChanged(partyId));
    }
}
