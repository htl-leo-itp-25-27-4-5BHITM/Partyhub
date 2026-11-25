package at.htl;

import jakarta.persistence.EntityManager;

import java.util.Collection;

/** Removes the users a test created together with everything that references them. */
public final class TestCleanup {

    private TestCleanup() {
    }

    public static void removeUsers(EntityManager em, Collection<Long> ids) {
        if (ids.isEmpty()) {
            return;
        }
        em.createQuery("DELETE FROM Notification n WHERE n.recipient.id IN :ids OR n.sender.id IN :ids")
                .setParameter("ids", ids).executeUpdate();
        em.createQuery("DELETE FROM FollowEvent e WHERE e.follower.id IN :ids OR e.followed.id IN :ids")
                .setParameter("ids", ids).executeUpdate();
        em.createQuery("DELETE FROM Follow f WHERE f.user1_id IN :ids OR f.user2_id IN :ids")
                .setParameter("ids", ids).executeUpdate();
        em.createQuery("DELETE FROM UserBlock b WHERE b.blockerId IN :ids OR b.blockedId IN :ids")
                .setParameter("ids", ids).executeUpdate();
        em.createQuery("DELETE FROM EmailChangeRequest r WHERE r.user.id IN :ids").setParameter("ids", ids).executeUpdate();
        em.createQuery("DELETE FROM EmailChangeAttempt a WHERE a.userId IN :ids").setParameter("ids", ids).executeUpdate();
        em.createQuery("DELETE FROM UserSettings s WHERE s.userId IN :ids").setParameter("ids", ids).executeUpdate();
        em.createQuery("DELETE FROM UserNotificationSettings s WHERE s.id IN :ids").setParameter("ids", ids).executeUpdate();
        em.createQuery("DELETE FROM ProfilePicture p WHERE p.user.id IN :ids").setParameter("ids", ids).executeUpdate();
        em.createQuery("SELECT p FROM Party p WHERE p.host_user.id IN :ids", at.htl.party.Party.class)
                .setParameter("ids", ids).getResultList().forEach(party -> {
                    at.htl.location.Location location = party.getLocation();
                    em.remove(party);
                    if (location != null) {
                        em.remove(location);
                    }
                });
        em.flush();
        em.createQuery("DELETE FROM User u WHERE u.id IN :ids").setParameter("ids", ids).executeUpdate();
    }
}
