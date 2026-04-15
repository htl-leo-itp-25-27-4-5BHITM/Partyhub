package at.htl.repository;

import at.htl.user.User;
import at.htl.user.UserCreateDto;
import at.htl.user.UserRepository;
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
public class UserRepositoryTest {

    @Inject
    UserRepository userRepository;

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
        entityManager.createQuery("DELETE FROM Location").executeUpdate();
        entityManager.createQuery("DELETE FROM FollowStatus").executeUpdate();
    }

    @Test
    void testGetUsers_empty() {
        List<User> users = userRepository.getUsers();
        assertNotNull(users);
        assertTrue(users.isEmpty());
    }

    @Test
    void testGetUsers_afterCreate() {
        User user = new User();
        user.setDisplayName("Test User");
        user.setDistinctName("testuser");
        user.setEmail("test@example.com");
        entityManager.persist(user);
        entityManager.flush();

        List<User> users = userRepository.getUsers();
        assertEquals(1, users.size());
        assertEquals("testuser", users.get(0).getDistinctName());
    }

    @Test
    void testGetUser_byId() {
        User user = new User();
        user.setDisplayName("Test User");
        user.setDistinctName("testuser");
        user.setEmail("test@example.com");
        entityManager.persist(user);
        entityManager.flush();

        User found = userRepository.getUser(user.getId());
        assertNotNull(found);
        assertEquals("testuser", found.getDistinctName());
    }

    @Test
    void testGetUser_notFound() {
        User found = userRepository.getUser(999L);
        assertNull(found);
    }

    @Test
    void testFindByEmail() {
        User user = new User();
        user.setDisplayName("Test User");
        user.setDistinctName("testuser");
        user.setEmail("test@example.com");
        entityManager.persist(user);
        entityManager.flush();

        User found = userRepository.findByEmail("test@example.com");
        assertNotNull(found);
        assertEquals("testuser", found.getDistinctName());
    }

    @Test
    void testFindByEmail_notFound() {
        User found = userRepository.findByEmail("nonexistent@example.com");
        assertNull(found);
    }

    @Test
    void testFindByDistinctName() {
        User user = new User();
        user.setDisplayName("Test User");
        user.setDistinctName("testuser");
        user.setEmail("test@example.com");
        entityManager.persist(user);
        entityManager.flush();

        User found = userRepository.findByDistinctName("testuser");
        assertNotNull(found);
        assertEquals("test@example.com", found.getEmail());
    }

    @Test
    void testFindByDistinctName_notFound() {
        User found = userRepository.findByDistinctName("nonexistent");
        assertNull(found);
    }

    @Test
    void testCreateUser() {
        User user = new User();
        user.setDisplayName("New User");
        user.setDistinctName("newuser");
        user.setEmail("new@example.com");

        Response response = userRepository.createUser(user);
        assertEquals(201, response.getStatus());

        List<User> users = userRepository.getUsers();
        assertEquals(1, users.size());
    }

    @Test
    void testUpdateUser() {
        User user = new User();
        user.setDisplayName("Original Name");
        user.setDistinctName("original");
        user.setEmail("original@example.com");
        entityManager.persist(user);
        entityManager.flush();

        UserCreateDto dto = new UserCreateDto("Updated Name", "updated", "updated@example.com", "New bio");
        Response response = userRepository.updateUser(user.getId(), dto);
        
        assertEquals(200, response.getStatus());
        
        User updated = userRepository.getUser(user.getId());
        assertEquals("Updated Name", updated.getDisplayName());
        assertEquals("updated", updated.getDistinctName());
    }

    @Test
    void testUpdateUser_notFound() {
        UserCreateDto dto = new UserCreateDto("Name", "handle", "email@test.com", "bio");
        Response response = userRepository.updateUser(999L, dto);
        
        assertEquals(404, response.getStatus());
    }

    @Test
    void testGetUsersByDistinctNameSearch() {
        User user1 = new User();
        user1.setDisplayName("User One");
        user1.setDistinctName("user_one");
        user1.setEmail("one@example.com");
        
        User user2 = new User();
        user2.setDisplayName("User Two");
        user2.setDistinctName("user_two");
        user2.setEmail("two@example.com");
        
        entityManager.persist(user1);
        entityManager.persist(user2);
        entityManager.flush();

        List<User> results = userRepository.getUsersByDistinctNameSearch("user_");
        assertEquals(2, results.size());
    }
}
