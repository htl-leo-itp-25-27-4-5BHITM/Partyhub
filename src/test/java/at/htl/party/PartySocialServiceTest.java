package at.htl.party;

import at.htl.follow.Follow;
import at.htl.follow.FollowStatus;
import at.htl.location.Location;
import at.htl.user.User;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.TestTransaction;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class PartySocialServiceTest {
    @Inject EntityManager em;
    @Inject PartySocialService service;
    @Inject PartyRepository repository;

    User user(String name) {
        User user = new User();
        user.setDisplayName(name);
        user.setDistinctName(name + UUID.randomUUID());
        em.persist(user);
        return user;
    }
    Party party(User host) {
        Location location = new Location();
        location.setAddress("Social test"); location.setLatitude(48.3); location.setLongitude(14.3);
        em.persist(location);
        Party party = new Party();
        party.setHost_user(host); party.setTitle("Social test"); party.setLocation(location);
        party.setTime_start(LocalDateTime.now().plusDays(1));
        em.persist(party);
        return party;
    }
    void follow(User from, User to, long statusId) {
        FollowStatus status = em.find(FollowStatus.class, statusId);
        if (status == null) {
            status = new FollowStatus(); status.setStatus_id(statusId);
            status.setName(statusId == 2 ? "ACCEPTED" : "PENDING"); em.persist(status);
        }
        Follow follow = new Follow(); follow.setUser1_id(from.getId()); follow.setUser2_id(to.getId());
        follow.setStatus(status); em.persist(follow);
    }
    void mutual(User a, User b) { follow(a,b,2); follow(b,a,2); }

    @Test @TestTransaction
    void countsOnlyJoinedMutualContactsAndCapsListButNotDetails() {
        User viewer = user("Viewer");
        Party party = party(user("Host"));
        for (int i=0;i<5;i++) {
            User friend = user("Friend"+i); mutual(viewer,friend); party.getUsers().add(friend);
        }
        User notJoined = user("Not joined"); mutual(viewer,notJoined);
        User oneWay = user("One way"); follow(viewer,oneWay,2); party.getUsers().add(oneWay);
        User pending = user("Pending"); follow(viewer,pending,2); follow(pending,viewer,1); party.getUsers().add(pending);
        party.getUsers().add(viewer);
        em.flush();
        service.enrichVisibleParties(List.of(party),viewer.getId(),false);
        assertEquals(5,party.getDiscoverySocial().friendCount());
        assertEquals(3,party.getDiscoverySocial().friends().size());
        assertEquals("Host",party.getDiscoverySocial().host().name());
        service.enrichVisibleParties(List.of(party),viewer.getId(),true);
        assertEquals(5,party.getDiscoverySocial().friends().size());
    }
    @Test @TestTransaction
    void anonymousSummaryClearsPersonalizedDataAndKeepsHost() {
        User viewer = user("Viewer"); User friend = user("Friend"); mutual(viewer,friend);
        Party party = party(user("Host")); party.getUsers().add(friend); em.flush();
        service.enrichVisibleParties(List.of(party),viewer.getId(),false);
        assertEquals(1,party.getDiscoverySocial().friendCount());
        service.enrichVisibleParties(List.of(party),null,false);
        assertEquals(0,party.getDiscoverySocial().friendCount());
        assertTrue(party.getDiscoverySocial().friends().isEmpty());
        assertEquals("Host",party.getDiscoverySocial().host().name());
    }
    @Test @TestTransaction
    void summariesStayScopedToAuthorizedParties() {
        User viewer = user("Viewer"); User host = user("Host"); User friend = user("Friend"); mutual(viewer,friend);
        Party visible = party(host); Party hidden = party(host); hidden.setVisibility("PRIVATE");
        hidden.getUsers().add(friend); em.flush();
        assertNull(repository.getPartyByIdIfVisible(hidden.getId(),viewer.getId()));
        service.enrichVisibleParties(List.of(visible),viewer.getId(),false);
        assertEquals(0,visible.getDiscoverySocial().friendCount());
        assertNull(hidden.getDiscoverySocial());
    }
}
