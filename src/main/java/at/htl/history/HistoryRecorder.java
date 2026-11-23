package at.htl.history;

import at.htl.party.Party;
import at.htl.user.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;

/**
 * Writes follow and attendance history. Callers invoke it inside the transaction that
 * commits the state change, so a rollback also discards the history entry.
 */
@ApplicationScoped
public class HistoryRecorder {
    @Inject
    EntityManager entityManager;

    @Transactional(Transactional.TxType.MANDATORY)
    public void recordFollow(long followerId, long followedId, FollowEventType type) {
        User follower = entityManager.getReference(User.class, followerId);
        User followed = entityManager.getReference(User.class, followedId);
        entityManager.persist(new FollowEvent(follower, followed, type, LocalDateTime.now()));
    }

    @Transactional(Transactional.TxType.MANDATORY)
    public void recordAttendance(Party party, User user, AttendanceEventType type) {
        entityManager.persist(new AttendanceEvent(party, user, type, LocalDateTime.now()));
    }
}
