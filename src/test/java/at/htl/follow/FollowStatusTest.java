package at.htl.follow;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
@Transactional
public class FollowStatusTest {

    @Inject
    EntityManager entityManager;

    @Test
    void testGettersAndSetters() {
        FollowStatus status = new FollowStatus();
        status.setStatus_id(10L);
        status.setName("TEST");

        assertEquals(10L, status.getStatus_id());
        assertEquals("TEST", status.getName());
    }

    @Test
    void testPersistAndRetrieve() {
        FollowStatus status = new FollowStatus();
        status.setStatus_id(99L);
        status.setName("CUSTOM");
        entityManager.persist(status);

        FollowStatus retrieved = entityManager.find(FollowStatus.class, 99L);
        assertNotNull(retrieved);
        assertEquals("CUSTOM", retrieved.getName());
    }
}
