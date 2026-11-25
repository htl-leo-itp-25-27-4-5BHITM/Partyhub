package at.htl.block;

import at.htl.follow.FollowRepository;
import at.htl.invitation.Invitation;
import at.htl.notification.NotificationRepository;
import at.htl.user.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class BlockRepository {

    @Inject
    EntityManager em;

    @Inject
    FollowRepository followRepository;

    @Inject
    NotificationRepository notificationRepository;

    public boolean isBlockedEitherWay(Long a, Long b) {
        if (a == null || b == null) {
            return false;
        }
        return em.createQuery(
                        "SELECT COUNT(b) FROM UserBlock b WHERE (b.blockerId = :a AND b.blockedId = :b) " +
                                "OR (b.blockerId = :b AND b.blockedId = :a)", Long.class)
                .setParameter("a", a)
                .setParameter("b", b)
                .getSingleResult() > 0;
    }

    /** Everyone who blocks {@code userId} or is blocked by them. */
    public java.util.Set<Long> blockedEitherWayIds(Long userId) {
        if (userId == null) {
            return java.util.Set.of();
        }
        java.util.Set<Long> ids = new java.util.HashSet<>(em.createQuery(
                        "SELECT b.blockedId FROM UserBlock b WHERE b.blockerId = :id", Long.class)
                .setParameter("id", userId).getResultList());
        ids.addAll(em.createQuery("SELECT b.blockerId FROM UserBlock b WHERE b.blockedId = :id", Long.class)
                .setParameter("id", userId).getResultList());
        return ids;
    }

    /** The users the caller blocked, newest first. */
    public List<User> blockedBy(Long blockerId) {
        return em.createQuery(
                        "SELECT u FROM UserBlock b JOIN User u ON u.id = b.blockedId " +
                                "WHERE b.blockerId = :blocker ORDER BY b.createdAt DESC", User.class)
                .setParameter("blocker", blockerId)
                .getResultList();
    }

    /**
     * Blocks silently: removes follows and requests in both directions and withdraws pending
     * private-party invitations between the two users. Repeating a block changes nothing.
     */
    @Transactional
    public boolean block(Long blockerId, Long blockedId) {
        if (em.find(UserBlock.class, new UserBlock.Key(blockerId, blockedId)) != null) {
            return false;
        }
        em.persist(new UserBlock(blockerId, blockedId));
        followRepository.removeAllBetween(blockerId, blockedId);
        List<Invitation> pending = em.createQuery(
                        "SELECT i FROM Invitation i WHERE i.status = :pending AND " +
                                "((i.sender.id = :a AND i.recipient.id = :b) OR (i.sender.id = :b AND i.recipient.id = :a))",
                        Invitation.class)
                .setParameter("pending", "PENDING")
                .setParameter("a", blockerId)
                .setParameter("b", blockedId)
                .getResultList();
        for (Invitation invitation : pending) {
            if (invitation.getParty() != null) {
                notificationRepository.deleteInvitationNotifications(invitation.getParty().getId(),
                        invitation.getSender().getId(), invitation.getRecipient().getId());
                invitation.getParty().getInvitations().remove(invitation);
            }
            em.remove(invitation);
        }
        return true;
    }

    /** Removes only the block; earlier follows are not restored. */
    @Transactional
    public boolean unblock(Long blockerId, Long blockedId) {
        UserBlock block = em.find(UserBlock.class, new UserBlock.Key(blockerId, blockedId));
        if (block == null) {
            return false;
        }
        em.remove(block);
        return true;
    }
}
