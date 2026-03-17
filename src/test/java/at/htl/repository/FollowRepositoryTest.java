package at.htl.repository;

import at.htl.follow.Follow;
import at.htl.follow.FollowRepository;
import at.htl.follow.FollowStatus;
import at.htl.user.User;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
@Transactional
public class FollowRepositoryTest {

    @Inject
    FollowRepository followRepository;

    @Inject
    EntityManager entityManager;

    @BeforeEach
    void setUp() {
        // Clean up in proper order due to foreign key constraints
        entityManager.createQuery("DELETE FROM UserLocation").executeUpdate();
        entityManager.createQuery("DELETE FROM Follow").executeUpdate();
        entityManager.createQuery("DELETE FROM Invitation").executeUpdate();
        entityManager.createQuery("DELETE FROM Media").executeUpdate();
        entityManager.createQuery("DELETE FROM Party").executeUpdate();
        entityManager.createQuery("DELETE FROM ProfilePicture").executeUpdate();
        entityManager.createQuery("DELETE FROM User").executeUpdate();
        entityManager.createQuery("DELETE FROM Category").executeUpdate();
        entityManager.createQuery("DELETE FROM Location").executeUpdate();
        entityManager.createQuery("DELETE FROM FollowStatus").executeUpdate();
    }

    private User createTestUser(String name) {
        User user = new User();
        user.setDisplayName(name);
        user.setDistinctName(name.toLowerCase().replace(" ", ""));
        user.setEmail(name.toLowerCase().replace(" ", ".") + "@example.com");
        entityManager.persist(user);
        return user;
    }

    @Test
    void testGetFollowerCount() {
        User user1 = createTestUser("User One");
        User user2 = createTestUser("User Two");
        entityManager.flush();

        FollowStatus accepted = new FollowStatus();
        accepted.setStatus_id(2L);
        accepted.setName("accepted");
        entityManager.persist(accepted);

        Follow follow = new Follow();
        follow.setUser1_id(user1.getId());
        follow.setUser2_id(user2.getId());
        follow.setStatus(accepted);
        entityManager.persist(follow);
        entityManager.flush();

        long count = followRepository.getFollowerCount(user2.getId());
        assertEquals(1, count);
    }

    @Test
    void testGetFollowingCount() {
        User user1 = createTestUser("User One");
        User user2 = createTestUser("User Two");
        entityManager.flush();

        FollowStatus accepted = new FollowStatus();
        accepted.setStatus_id(2L);
        accepted.setName("accepted");
        entityManager.persist(accepted);

        Follow follow = new Follow();
        follow.setUser1_id(user1.getId());
        follow.setUser2_id(user2.getId());
        follow.setStatus(accepted);
        entityManager.persist(follow);
        entityManager.flush();

        long count = followRepository.getFollowingCount(user1.getId());
        assertEquals(1, count);
    }

    @Test
    void testIsFollowing_true() {
        User user1 = createTestUser("User One");
        User user2 = createTestUser("User Two");
        entityManager.flush();

        FollowStatus accepted = new FollowStatus();
        accepted.setStatus_id(2L);
        accepted.setName("accepted");
        entityManager.persist(accepted);

        Follow follow = new Follow();
        follow.setUser1_id(user1.getId());
        follow.setUser2_id(user2.getId());
        follow.setStatus(accepted);
        entityManager.persist(follow);
        entityManager.flush();

        boolean following = followRepository.isFollowing(user1.getId(), user2.getId());
        assertTrue(following);
    }

    @Test
    void testIsFollowing_false() {
        User user1 = createTestUser("User One");
        User user2 = createTestUser("User Two");
        entityManager.flush();

        boolean following = followRepository.isFollowing(user1.getId(), user2.getId());
        assertFalse(following);
    }

    @Test
    void testCreateFollowRequest() {
        User user1 = createTestUser("User One");
        User user2 = createTestUser("User Two");
        entityManager.flush();

        FollowStatus pending = new FollowStatus();
        pending.setStatus_id(1L);
        pending.setName("pending");
        entityManager.persist(pending);
        entityManager.flush();

        Response response = followRepository.createFollowRequest(user1.getId(), user2.getId());
        assertEquals(201, response.getStatus());
    }

    @Test
    void testCreateFollowRequest_duplicate() {
        User user1 = createTestUser("User One");
        User user2 = createTestUser("User Two");
        entityManager.flush();

        FollowStatus pending = new FollowStatus();
        pending.setStatus_id(1L);
        pending.setName("pending");
        entityManager.persist(pending);

        Follow follow = new Follow();
        follow.setUser1_id(user1.getId());
        follow.setUser2_id(user2.getId());
        follow.setStatus(pending);
        entityManager.persist(follow);
        entityManager.flush();

        Response response = followRepository.createFollowRequest(user1.getId(), user2.getId());
        assertEquals(409, response.getStatus());
    }

    @Test
    void testRemoveFollow() {
        User user1 = createTestUser("User One");
        User user2 = createTestUser("User Two");
        entityManager.flush();

        FollowStatus accepted = new FollowStatus();
        accepted.setStatus_id(2L);
        accepted.setName("accepted");
        entityManager.persist(accepted);

        Follow follow = new Follow();
        follow.setUser1_id(user1.getId());
        follow.setUser2_id(user2.getId());
        follow.setStatus(accepted);
        entityManager.persist(follow);
        entityManager.flush();

        Response response = followRepository.removeFollow(user1.getId(), user2.getId());
        assertEquals(204, response.getStatus());

        List<Follow> follows = entityManager.createQuery("SELECT f FROM Follow f", Follow.class).getResultList();
        assertTrue(follows.isEmpty());
    }

    @Test
    void testGetFollowers() {
        User user1 = createTestUser("User One");
        User user2 = createTestUser("User Two");
        entityManager.flush();

        FollowStatus accepted = new FollowStatus();
        accepted.setStatus_id(2L);
        accepted.setName("accepted");
        entityManager.persist(accepted);

        Follow follow = new Follow();
        follow.setUser1_id(user1.getId());
        follow.setUser2_id(user2.getId());
        follow.setStatus(accepted);
        entityManager.persist(follow);
        entityManager.flush();

        List<User> followers = followRepository.getFollowers(user2.getId());
        assertEquals(1, followers.size());
    }

    @Test
    void testGetFollowing() {
        User user1 = createTestUser("User One");
        User user2 = createTestUser("User Two");
        entityManager.flush();

        FollowStatus accepted = new FollowStatus();
        accepted.setStatus_id(2L);
        accepted.setName("accepted");
        entityManager.persist(accepted);

        Follow follow = new Follow();
        follow.setUser1_id(user1.getId());
        follow.setUser2_id(user2.getId());
        follow.setStatus(accepted);
        entityManager.persist(follow);
        entityManager.flush();

        List<User> following = followRepository.getFollowing(user1.getId());
        assertEquals(1, following.size());
    }
}
