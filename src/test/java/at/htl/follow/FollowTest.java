package at.htl.follow;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
@Transactional
public class FollowTest {

    @Inject
    EntityManager entityManager;

    @Test
    void testGettersAndSetters() {
        Follow follow = new Follow();

        follow.setUser1_id(1L);
        follow.setUser2_id(2L);

        FollowStatus status = new FollowStatus();
        status.setStatus_id(1L);
        status.setName("PENDING");
        follow.setStatus(status);

        assertEquals(1L, follow.getUser1_id());
        assertEquals(2L, follow.getUser2_id());
        assertEquals(status, follow.getStatus());
        assertEquals(1L, follow.getStatus().getStatus_id());
    }

    @Test
    void testEquals_sameObject() {
        Follow follow = new Follow();
        follow.setUser1_id(1L);
        follow.setUser2_id(2L);
        assertTrue(follow.equals(follow));
    }

    @Test
    void testEquals_null() {
        Follow follow = new Follow();
        assertFalse(follow.equals(null));
    }

    @Test
    void testEquals_differentClass() {
        Follow follow = new Follow();
        assertFalse(follow.equals("string"));
    }

    @Test
    void testEquals_equalObjects() {
        Follow follow1 = new Follow();
        follow1.setUser1_id(1L);
        follow1.setUser2_id(2L);

        Follow follow2 = new Follow();
        follow2.setUser1_id(1L);
        follow2.setUser2_id(2L);

        assertTrue(follow1.equals(follow2));
        assertEquals(follow1.hashCode(), follow2.hashCode());
    }

    @Test
    void testEquals_differentUser1() {
        Follow follow1 = new Follow();
        follow1.setUser1_id(1L);
        follow1.setUser2_id(2L);

        Follow follow2 = new Follow();
        follow2.setUser1_id(3L);
        follow2.setUser2_id(2L);

        assertFalse(follow1.equals(follow2));
    }

    @Test
    void testEquals_differentUser2() {
        Follow follow1 = new Follow();
        follow1.setUser1_id(1L);
        follow1.setUser2_id(2L);

        Follow follow2 = new Follow();
        follow2.setUser1_id(1L);
        follow2.setUser2_id(3L);

        assertFalse(follow1.equals(follow2));
    }

    @Test
    void testHashCode() {
        Follow follow = new Follow();
        follow.setUser1_id(1L);
        follow.setUser2_id(2L);
        assertNotNull(follow.hashCode());
    }

    @Test
    void testPersistAndRetrieve() {
        FollowStatus status = new FollowStatus();
        status.setStatus_id(1L);
        status.setName("PENDING");
        entityManager.persist(status);

        Follow follow = new Follow();
        follow.setUser1_id(100L);
        follow.setUser2_id(200L);
        follow.setStatus(status);
        entityManager.persist(follow);

        Follow retrieved = entityManager.createQuery("SELECT f FROM Follow f WHERE f.user1_id = 100 AND f.user2_id = 200", Follow.class).getSingleResult();
        assertNotNull(retrieved);
        assertEquals(100L, retrieved.getUser1_id());
    }
}
