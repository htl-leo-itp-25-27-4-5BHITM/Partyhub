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
        entityManager.createQuery("DELETE FROM Notification").executeUpdate();
        entityManager.createQuery("DELETE FROM Follow").executeUpdate();
        entityManager.createQuery("DELETE FROM Invitation").executeUpdate();
        entityManager.createQuery("DELETE FROM Media").executeUpdate();
        entityManager.createQuery("DELETE FROM Party").executeUpdate();
        entityManager.createQuery("DELETE FROM ProfilePicture").executeUpdate();
        entityManager.createQuery("DELETE FROM UserNotificationSettings").executeUpdate();
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

        UserCreateDto dto = new UserCreateDto("Updated Name", "updated", "updated@example.com", "+436641234567", "New bio");
        Response response = userRepository.updateUser(user.getId(), dto);
        
        assertEquals(200, response.getStatus());
        
        User updated = userRepository.getUser(user.getId());
        assertEquals("Updated Name", updated.getDisplayName());
        assertEquals("updated", updated.getDistinctName());
        assertEquals("+436641234567", updated.getPhoneNumber());
    }

    @Test
    void testUpdateUser_notFound() {
        UserCreateDto dto = new UserCreateDto("Name", "handle", "email@test.com", "+436649999999", "bio");
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

    @Test
    void testFindById_found() {
        User user = new User();
        user.setDisplayName("Test User");
        user.setDistinctName("testuser");
        user.setEmail("test@example.com");
        entityManager.persist(user);
        entityManager.flush();

        var found = userRepository.findById(user.getId());
        assertTrue(found.isPresent());
        assertEquals("testuser", found.get().getDistinctName());
    }

    @Test
    void testFindById_notFound() {
        var found = userRepository.findById(999L);
        assertTrue(found.isEmpty());
    }

    @Test
    void testFindByUsername_found() {
        User user = new User();
        user.setDisplayName("Test User");
        user.setDistinctName("testuser");
        user.setEmail("test@example.com");
        user.setUsername("testusername");
        entityManager.persist(user);
        entityManager.flush();

        var found = userRepository.findByUsername("testusername");
        assertTrue(found.isPresent());
        assertEquals("testuser", found.get().getDistinctName());
    }

    @Test
    void testFindByKeycloakId_found() {
        User user = new User();
        user.setDisplayName("Keycloak User");
        user.setDistinctName("keycloakuser");
        user.setEmail("keycloak@example.com");
        user.setKeycloakId("kc-subject-1");
        entityManager.persist(user);
        entityManager.flush();

        var found = userRepository.findByKeycloakId("kc-subject-1");
        assertTrue(found.isPresent());
        assertEquals("keycloakuser", found.get().getDistinctName());
    }

    @Test
    void testFindUnlinkedByUsernameOrEmail_matchesUsername() {
        User user = new User();
        user.setUsername("viki_dji");
        user.setDisplayName("Victoria Vejmelek");
        user.setDistinctName("viki_vejmelek");
        user.setEmail("v.vejmelek@students.htl-leonding.ac.at");
        entityManager.persist(user);
        entityManager.flush();

        var found = userRepository.findUnlinkedByUsernameOrEmail("viki_dji", null);
        assertTrue(found.isPresent());
        assertEquals("viki_vejmelek", found.get().getDistinctName());
    }

    @Test
    void testLinkKeycloakId_updatesUser() {
        User user = new User();
        user.setUsername("link_me");
        user.setDisplayName("Link Me");
        user.setDistinctName("link_me");
        user.setEmail("link@example.com");
        entityManager.persist(user);
        entityManager.flush();

        User linked = userRepository.linkKeycloakId(user, "kc-linked");
        entityManager.flush();

        assertEquals("kc-linked", linked.getKeycloakId());
        assertTrue(userRepository.findByKeycloakId("kc-linked").isPresent());
    }

    @Test
    void testFindByUsername_notFound() {
        var found = userRepository.findByUsername("nonexistent");
        assertTrue(found.isEmpty());
    }

    @Test
    void testPersist() {
        User user = new User();
        user.setDisplayName("Persist User");
        user.setDistinctName("persistuser");
        user.setEmail("persist@example.com");

        userRepository.persist(user);
        entityManager.flush();

        assertNotNull(user.getId());
        assertTrue(user.getId() > 0);
    }
}
