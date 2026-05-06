package at.htl.repository;

import at.htl.location.Location;
import at.htl.party.Party;
import at.htl.user.User;
import at.htl.user_location.UserLocation;
import at.htl.user_location.UserLocationRepository;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
@Transactional
public class UserLocationRepositoryTest {

    @Inject
    UserLocationRepository userLocationRepository;

    @Inject
    EntityManager entityManager;

    @BeforeEach
    void setUp() {
        entityManager.createQuery("DELETE FROM Notification").executeUpdate();
        entityManager.createQuery("DELETE FROM UserLocation").executeUpdate();
        entityManager.createQuery("DELETE FROM Party").executeUpdate();
        entityManager.createQuery("DELETE FROM User").executeUpdate();
        entityManager.flush();
    }

    private User createUser(String distinctName) {
        User user = new User();
        user.setDisplayName("Test User " + distinctName);
        user.setDistinctName(distinctName);
        user.setEmail(distinctName + "@example.com");
        entityManager.persist(user);
        entityManager.flush();
        return user;
    }

    private Location createLocation() {
        Location location = new Location();
        location.setAddress("Test Address");
        location.setLatitude(48.2082);
        location.setLongitude(16.3738);
        entityManager.persist(location);
        entityManager.flush();
        return location;
    }

    @Test
    void testGetAllLocations_empty() {
        List<UserLocation> locations = userLocationRepository.getAllLocations();
        assertNotNull(locations);
        assertTrue(locations.isEmpty());
    }

    @Test
    void testGetAllLocations_withData() {
        User user = createUser("user1");

        UserLocation location = new UserLocation();
        location.setUser(user);
        location.setLatitude(48.2082);
        location.setLongitude(16.3738);
        entityManager.persist(location);

        List<UserLocation> locations = userLocationRepository.getAllLocations();
        assertEquals(1, locations.size());
    }

    @Test
    void testFindByUserId_found() {
        User user = createUser("user2");

        UserLocation location = new UserLocation();
        location.setUser(user);
        location.setLatitude(48.2);
        location.setLongitude(16.3);
        entityManager.persist(location);
        entityManager.flush();

        UserLocation found = userLocationRepository.findByUserId(user.getId());
        assertNotNull(found);
        assertEquals(user.getId(), found.getUser().getId());
    }

    @Test
    void testFindByUserId_notFound() {
        UserLocation found = userLocationRepository.findByUserId(999L);
        assertNull(found);
    }

    @Test
    void testSaveOrUpdate_persist() {
        User user = createUser("user3");

        UserLocation location = new UserLocation();
        location.setUser(user);
        location.setLatitude(48.2);
        location.setLongitude(16.3);

        userLocationRepository.saveOrUpdate(location);
        entityManager.flush();

        assertNotNull(location.getId());
        assertTrue(location.getId() > 0);
    }

    @Test
    void testSaveOrUpdate_update() {
        User user = createUser("user4");

        UserLocation location = new UserLocation();
        location.setUser(user);
        location.setLatitude(48.2);
        location.setLongitude(16.3);
        entityManager.persist(location);
        entityManager.flush();

        location.setLatitude(49.0);
        userLocationRepository.saveOrUpdate(location);
        entityManager.flush();

        UserLocation updated = entityManager.find(UserLocation.class, location.getId());
        assertEquals(49.0, updated.getLatitude());
    }

    @Test
    void testGetLocationsByPartyId_empty() {
        Location loc = createLocation();
        Party party = new Party();
        party.setTitle("Test Party");
        party.setLocation(loc);
        entityManager.persist(party);
        entityManager.flush();

        List<UserLocation> locations = userLocationRepository.getLocationsByPartyId(party.getId());
        assertTrue(locations.isEmpty());
    }

    @Test
    void testGetLocationsByPartyId_withData() {
        User user = createUser("user5");
        Location loc = createLocation();

        Party party = new Party();
        party.setTitle("Test Party");
        party.setLocation(loc);
        party.getUsers().add(user);
        entityManager.persist(party);

        UserLocation location = new UserLocation();
        location.setUser(user);
        location.setLatitude(48.2);
        location.setLongitude(16.3);
        entityManager.persist(location);
        entityManager.flush();

        List<UserLocation> locations = userLocationRepository.getLocationsByPartyId(party.getId());
        assertEquals(1, locations.size());
    }
}
