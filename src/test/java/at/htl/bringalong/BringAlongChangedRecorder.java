package at.htl.bringalong;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.event.TransactionPhase;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/** Records committed bring-along changes so tests can assert which writes notify clients. */
@ApplicationScoped
public class BringAlongChangedRecorder {
    private final List<Long> partyIds = new CopyOnWriteArrayList<>();

    void record(@Observes(during = TransactionPhase.AFTER_SUCCESS) BringAlongChanged event) {
        partyIds.add(event.partyId());
    }

    public long count(Long partyId) {
        return partyIds.stream().filter(partyId::equals).count();
    }

    public void clear() {
        partyIds.clear();
    }
}
