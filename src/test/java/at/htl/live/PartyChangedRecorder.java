package at.htl.live;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.event.TransactionPhase;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/** Records committed guest-list changes so tests can assert which writes notify detail pages. */
@ApplicationScoped
public class PartyChangedRecorder {
    private final List<Long> partyIds = new CopyOnWriteArrayList<>();

    void record(@Observes(during = TransactionPhase.AFTER_SUCCESS) PartyChanged event) {
        partyIds.add(event.partyId());
    }

    public boolean received(Long partyId) {
        return partyIds.contains(partyId);
    }

    public void clear() {
        partyIds.clear();
    }
}
