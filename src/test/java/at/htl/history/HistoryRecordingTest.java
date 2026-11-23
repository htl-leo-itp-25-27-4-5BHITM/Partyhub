package at.htl.history;

import at.htl.follow.Follow;
import at.htl.follow.FollowRepository;
import at.htl.follow.FollowStatus;
import at.htl.invitation.Invitation;
import at.htl.invitation.InvitationRepository;
import at.htl.location.Location;
import at.htl.party.Party;
import at.htl.party.PartyRepository;
import at.htl.user.User;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
@Transactional
class HistoryRecordingTest {

    @Inject EntityManager em;
    @Inject FollowRepository followRepository;
    @Inject PartyRepository partyRepository;
    @Inject InvitationRepository invitationRepository;

    User alice;
    User bob;
    Party party;
    Location location;

    @BeforeEach
    void setUp() {
        em.createQuery("DELETE FROM FollowEvent").executeUpdate();
        em.createQuery("DELETE FROM AttendanceEvent").executeUpdate();
        em.createQuery("DELETE FROM Notification").executeUpdate();
        em.createQuery("DELETE FROM Follow").executeUpdate();
        for (long id = 1; id <= 3; id++) {
            if (em.find(FollowStatus.class, id) == null) {
                FollowStatus status = new FollowStatus();
                status.setStatus_id(id);
                status.setName(id == 1 ? "pending" : id == 2 ? "accepted" : "blocked");
                em.persist(status);
            }
        }

        alice = user("history-alice");
        bob = user("history-bob");
        User host = user("history-host");

        location = new Location();
        location.setAddress("History test venue");
        location.setLatitude(48.3);
        location.setLongitude(14.2);
        em.persist(location);

        party = new Party();
        party.setHost_user(host);
        party.setLocation(location);
        party.setTitle("History test party");
        party.setVisibility("PUBLIC");
        party.setTime_start(LocalDateTime.now().plusDays(2));
        em.persist(party);
        em.flush();
    }

    @AfterEach
    void cleanup() {
        QuarkusTransaction.requiringNew().run(() -> {
            List<Long> users = List.of(alice.getId(), bob.getId(), party.getHost_user().getId());
            em.createQuery("DELETE FROM Notification n WHERE n.party.id = :partyId OR n.recipient.id IN :users OR n.sender.id IN :users")
                    .setParameter("partyId", party.getId()).setParameter("users", users).executeUpdate();
            em.createQuery("DELETE FROM Invitation i WHERE i.party.id = :partyId")
                    .setParameter("partyId", party.getId()).executeUpdate();
            em.createQuery("DELETE FROM Follow f WHERE f.user1_id IN :users OR f.user2_id IN :users")
                    .setParameter("users", users).executeUpdate();
            Party managed = em.find(Party.class, party.getId());
            if (managed != null) {
                em.remove(managed);
            }
            for (Long id : users) {
                em.remove(em.find(User.class, id));
            }
            em.remove(em.find(Location.class, location.getId()));
        });
    }

    private User user(String name) {
        User user = new User();
        user.setDisplayName(name);
        user.setDistinctName(name + "-" + System.nanoTime());
        em.persist(user);
        return user;
    }

    private void follow(User from, User to, long statusId) {
        Follow follow = new Follow();
        follow.setUser1_id(from.getId());
        follow.setUser2_id(to.getId());
        follow.setStatus(em.find(FollowStatus.class, statusId));
        em.persist(follow);
        em.flush();
    }

    private List<FollowEvent> followEvents() {
        em.flush();
        return em.createQuery("SELECT e FROM FollowEvent e ORDER BY e.id", FollowEvent.class).getResultList();
    }

    private List<AttendanceEvent> attendanceEvents() {
        em.flush();
        return em.createQuery("SELECT e FROM AttendanceEvent e WHERE e.party.id = :partyId ORDER BY e.id",
                AttendanceEvent.class).setParameter("partyId", party.getId()).getResultList();
    }

    @Test
    void acceptingFollowRequestRecordsFollowed() {
        follow(alice, bob, 1);

        followRepository.acceptFollowRequest(alice.getId(), bob.getId());

        List<FollowEvent> events = followEvents();
        assertEquals(1, events.size());
        assertEquals(FollowEventType.FOLLOWED, events.get(0).getType());
        assertEquals(alice.getId(), events.get(0).getFollower().getId());
        assertEquals(bob.getId(), events.get(0).getFollowed().getId());
    }

    @Test
    void removingAcceptedFollowRecordsUnfollowed() {
        follow(alice, bob, 2);

        followRepository.removeFollow(alice.getId(), bob.getId());

        List<FollowEvent> events = followEvents();
        assertEquals(1, events.size());
        assertEquals(FollowEventType.UNFOLLOWED, events.get(0).getType());
    }

    @Test
    void removingPendingRequestRecordsNothing() {
        follow(alice, bob, 1);

        followRepository.removeFollow(alice.getId(), bob.getId());

        assertTrue(followEvents().isEmpty());
    }

    @Test
    void joiningAndLeavingRecordsJoinedAndLeft() {
        partyRepository.attendParty(party.getId(), alice.getId());
        partyRepository.attendParty(party.getId(), alice.getId());
        partyRepository.leaveParty(party.getId(), alice.getId());

        List<AttendanceEvent> events = attendanceEvents();
        assertEquals(2, events.size(), "a repeated join must not create a second event");
        assertEquals(AttendanceEventType.JOINED, events.get(0).getType());
        assertEquals(AttendanceEventType.LEFT, events.get(1).getType());
    }

    @Test
    void deniedJoinRecordsNothing() {
        partyRepository.attendParty(party.getId(), party.getHost_user().getId());
        partyRepository.leaveParty(party.getId(), bob.getId());

        assertTrue(attendanceEvents().isEmpty());
    }

    @Test
    void acceptingAndDecliningInvitationRecordsJoinedAndLeft() {
        Party managedParty = em.find(Party.class, party.getId());
        Invitation invitation = new Invitation();
        invitation.setParty(managedParty);
        invitation.setSender(managedParty.getHost_user());
        invitation.setRecipient(em.find(User.class, bob.getId()));
        invitation.setStatus("PENDING");
        em.persist(invitation);
        em.flush();

        invitationRepository.acceptInvite(invitation.getId(), bob.getId());
        invitationRepository.declineInvite(invitation.getId(), bob.getId());

        List<AttendanceEvent> events = attendanceEvents();
        assertEquals(2, events.size());
        assertEquals(AttendanceEventType.JOINED, events.get(0).getType());
        assertEquals(bob.getId(), events.get(0).getUser().getId());
        assertEquals(AttendanceEventType.LEFT, events.get(1).getType());
    }
}
