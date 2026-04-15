package at.htl.repository;

import at.htl.location.Location;
import at.htl.party.Party;
import at.htl.party.PartyRepository;
import at.htl.user.User;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
@Transactional
public class PartyRepositoryTest {

    @Inject
    PartyRepository partyRepository;

    @Inject
    EntityManager entityManager;

    @BeforeEach
    void setUp() {
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

    private void createTestData() {
        Location location = new Location();
        location.setAddress("Test Address");
        location.setLatitude(48.2082);
        location.setLongitude(16.3738);
        entityManager.persist(location);

        User user = new User();
        user.setDisplayName("Test User");
        user.setDistinctName("testuser");
        user.setEmail("test@example.com");
        entityManager.persist(user);

        entityManager.flush();
    }

    @Test
    void testGetParties_empty() {
        createTestData();
        
        List<Party> parties = partyRepository.getParties();
        assertNotNull(parties);
        assertTrue(parties.isEmpty());
    }

    @Test
    void testGetParties_afterAdd() {
        createTestData();
        
        Location location = entityManager.createQuery("SELECT l FROM Location l", Location.class).getSingleResult();
        
        Party party = new Party();
        party.setTitle("Test Party");
        party.setDescription("Test Description");
        party.setTheme("Test Theme");
        party.setLocation(location);
        party.setTime_start(LocalDateTime.now());
        party.setTime_end(LocalDateTime.now().plusHours(2));
        party.setMax_people(50);
        party.setMin_age(18);
        party.setMax_age(35);
        entityManager.persist(party);
        entityManager.flush();

        List<Party> parties = partyRepository.getParties();
        assertEquals(1, parties.size());
        assertEquals("Test Party", parties.get(0).getTitle());
    }

    @Test
    void testGetPartyById() {
        createTestData();
        
        Location location = entityManager.createQuery("SELECT l FROM Location l", Location.class).getSingleResult();
        
        Party party = new Party();
        party.setTitle("Test Party");
        party.setDescription("Test Description");
        party.setTheme("Test Theme");
        party.setLocation(location);
        party.setTime_start(LocalDateTime.now());
        party.setTime_end(LocalDateTime.now().plusHours(2));
        party.setMax_people(50);
        party.setMin_age(18);
        party.setMax_age(35);
        entityManager.persist(party);
        entityManager.flush();

        Party found = partyRepository.getPartyById(party.getId());
        assertNotNull(found);
        assertEquals("Test Party", found.getTitle());
    }

    @Test
    void testGetPartyById_notFound() {
        createTestData();
        
        Party found = partyRepository.getPartyById(999L);
        assertNull(found);
    }

    @Test
    void testRemoveParty() {
        createTestData();
        
        Location location = entityManager.createQuery("SELECT l FROM Location l", Location.class).getSingleResult();
        
        Party party = new Party();
        party.setTitle("Test Party");
        party.setTheme("Test Theme");
        party.setLocation(location);
        party.setTime_start(LocalDateTime.now());
        party.setTime_end(LocalDateTime.now().plusHours(2));
        party.setMax_people(50);
        entityManager.persist(party);
        entityManager.flush();

        Response response = partyRepository.removeParty(party.getId());
        assertEquals(204, response.getStatus());

        Party found = partyRepository.getPartyById(party.getId());
        assertNull(found);
    }

    @Test
    void testRemoveParty_notFound() {
        createTestData();
        
        Response response = partyRepository.removeParty(999L);
        assertEquals(404, response.getStatus());
    }

    @Test
    void testSortParty_asc() {
        createTestData();
        
        Location location = entityManager.createQuery("SELECT l FROM Location l", Location.class).getSingleResult();
        
        Party party1 = new Party();
        party1.setTitle("Party B");
        party1.setTheme("Test Theme");
        party1.setLocation(location);
        party1.setTime_start(LocalDateTime.now().plusDays(2));
        party1.setTime_end(LocalDateTime.now().plusDays(2).plusHours(2));
        party1.setMax_people(50);
        
        Party party2 = new Party();
        party2.setTitle("Party A");
        party2.setTheme("Test Theme");
        party2.setLocation(location);
        party2.setTime_start(LocalDateTime.now().plusDays(1));
        party2.setTime_end(LocalDateTime.now().plusDays(1).plusHours(2));
        party2.setMax_people(50);
        
        entityManager.persist(party1);
        entityManager.persist(party2);
        entityManager.flush();

        Response response = partyRepository.sortParty("asc");
        assertEquals(200, response.getStatus());
        
        @SuppressWarnings("unchecked")
        List<Party> parties = (List<Party>) response.getEntity();
        assertEquals(2, parties.size());
        assertEquals("Party A", parties.get(0).getTitle());
    }
}
