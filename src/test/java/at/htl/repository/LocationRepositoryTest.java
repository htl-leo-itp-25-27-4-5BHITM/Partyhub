package at.htl.repository;

import at.htl.location.Location;
import at.htl.location.LocationRepository;
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
public class LocationRepositoryTest {

    @Inject
    LocationRepository locationRepository;

    @Inject
    EntityManager entityManager;

    @BeforeEach
    void setUp() {
        entityManager.createQuery("DELETE FROM Notification").executeUpdate();
        entityManager.createQuery("DELETE FROM Party").executeUpdate();
        entityManager.createQuery("DELETE FROM Location").executeUpdate();
        entityManager.flush();
    }

    @Test
    void testGetLocation_empty() {
        List<Location> locations = locationRepository.getLocation();
        assertNotNull(locations);
        assertTrue(locations.isEmpty());
    }

    @Test
    void testGetLocation_afterAdd() {
        Location location = new Location();
        location.setAddress("Test Address 1");
        location.setLatitude(48.2082);
        location.setLongitude(16.3738);
        entityManager.persist(location);

        Location location2 = new Location();
        location2.setAddress("Test Address 2");
        location2.setLatitude(48.2100);
        location2.setLongitude(16.3800);
        entityManager.persist(location2);
        entityManager.flush();

        List<Location> locations = locationRepository.getLocation();
        assertEquals(2, locations.size());
    }

    @Test
    void testAddLocation() {
        Location location = new Location();
        location.setAddress("New Location");
        location.setLatitude(48.2);
        location.setLongitude(16.3);

        var response = locationRepository.addLocation(location);
        assertEquals(200, response.getStatus());

        List<Location> locations = locationRepository.getLocation();
        assertEquals(1, locations.size());
        assertEquals("New Location", locations.get(0).getAddress());
    }

    @Test
    void testFindByLatitudeAndLongitude_found() {
        Location location = new Location();
        location.setAddress("Test Address");
        location.setLatitude(48.2082);
        location.setLongitude(16.3738);
        entityManager.persist(location);
        entityManager.flush();

        Location found = locationRepository.findByLatitudeAndLongitude(48.2082, 16.3738);
        assertNotNull(found);
        assertEquals("Test Address", found.getAddress());
    }

    @Test
    void testFindByLatitudeAndLongitude_notFound() {
        Location found = locationRepository.findByLatitudeAndLongitude(99.999, 99.999);
        assertNull(found);
    }

    @Test
    void testUpdateLocation() {
        Location location = new Location();
        location.setAddress("Original Address");
        location.setLatitude(48.2);
        location.setLongitude(16.3);
        entityManager.persist(location);
        entityManager.flush();

        location.setAddress("Updated Address");
        location.setLatitude(49.0);
        entityManager.persist(location);
        entityManager.flush();

        Location updated = entityManager.find(Location.class, location.getId());
        assertEquals("Updated Address", updated.getAddress());
        assertEquals(49.0, updated.getLatitude());
    }

    @Test
    void testDeleteLocation() {
        Location location = new Location();
        location.setAddress("To Delete");
        location.setLatitude(48.2);
        location.setLongitude(16.3);
        entityManager.persist(location);
        entityManager.flush();

        Long id = location.getId();
        entityManager.remove(location);
        entityManager.flush();

        Location found = entityManager.find(Location.class, id);
        assertNull(found);
    }
}
