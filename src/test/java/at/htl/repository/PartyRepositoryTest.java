package at.htl.repository;

import at.htl.location.Location;
import at.htl.notification.Notification;
import at.htl.party.Party;
import at.htl.party.PartyCreateDto;
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
        entityManager.createQuery("DELETE FROM Notification").executeUpdate();
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

    private PartyCreateDto createPartyDto(String visibility, List<String> selectedUsers) {
        return new PartyCreateDto(
                "Created Party",
                "Created Description",
                12.0,
                LocalDateTime.now().plusDays(1),
                LocalDateTime.now().plusDays(1).plusHours(2),
                50,
                18,
                35,
                "https://partyhub.test",
                48.2082,
                16.3738,
                "Test Address",
                "Test Theme",
                visibility,
                selectedUsers
        );
    }

    @Test
    void testGetParties_empty() {
        createTestData();

        List<Party> parties = partyRepository.getParties();
        assertNotNull(parties);
        assertTrue(parties.isEmpty());
    }

    @Test
    void testGetPartyById() {
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

        Party found = partyRepository.getPartyById(party.getId());
        assertNotNull(found);
        assertEquals("Test Party", found.getTitle());
    }

    @Test
    void testRemoveParty_withNotificationReference() {
        createTestData();

        Location location = entityManager.createQuery("SELECT l FROM Location l", Location.class).getSingleResult();
        User user = entityManager.createQuery("SELECT u FROM User u", User.class).getSingleResult();

        Party party = new Party();
        party.setTitle("Party With Notification");
        party.setTheme("Test Theme");
        party.setLocation(location);
        party.setTime_start(LocalDateTime.now());
        party.setTime_end(LocalDateTime.now().plusHours(2));
        party.setMax_people(50);
        entityManager.persist(party);
        entityManager.flush();

        Notification notification = new Notification(user, user, party, "Test notification");
        entityManager.persist(notification);
        entityManager.flush();

        Response response = partyRepository.removeParty(party.getId());
        assertEquals(204, response.getStatus());

        Long remainingNotifications = entityManager
                .createQuery("SELECT COUNT(n) FROM Notification n WHERE n.party.id = :partyId", Long.class)
                .setParameter("partyId", party.getId())
                .getSingleResult();
        assertEquals(0L, remainingNotifications);

        Party found = partyRepository.getPartyById(party.getId());
        assertNull(found);
    }

    @Test
    void testAddParty_normalizesPublicVisibility() {
        createTestData();
        User host = entityManager.createQuery("SELECT u FROM User u", User.class).getSingleResult();

        Response response = partyRepository.addParty(createPartyDto("public", List.of()), host.getId());

        assertEquals(201, response.getStatus());

        List<Party> publicParties = partyRepository.getPartiesByUser(null);
        assertEquals(1, publicParties.size());
        assertEquals("PUBLIC", publicParties.get(0).getVisibility());
    }

    @Test
    void testAddPrivatePartyInvitesSelectedUserById() {
        createTestData();
        User host = entityManager.createQuery("SELECT u FROM User u", User.class).getSingleResult();

        User recipient = new User();
        recipient.setDisplayName("Recipient User");
        recipient.setDistinctName("recipient");
        recipient.setEmail("recipient@example.com");
        entityManager.persist(recipient);
        entityManager.flush();

        Response response = partyRepository.addParty(
                createPartyDto("private", List.of(String.valueOf(recipient.getId()))),
                host.getId()
        );

        assertEquals(201, response.getStatus());

        Party party = entityManager.createQuery("SELECT p FROM Party p", Party.class).getSingleResult();
        assertEquals(1, party.getInvitations().size());
        assertEquals(recipient.getId(), party.getInvitations().iterator().next().getRecipient().getId());
    }

    @Test
    void testUpdatePublicPartyToPrivateInvitesSelectedUser() {
        createTestData();
        User host = entityManager.createQuery("SELECT u FROM User u", User.class).getSingleResult();

        User recipient = new User();
        recipient.setDisplayName("Update Recipient");
        recipient.setDistinctName("update-recipient");
        recipient.setEmail("update-recipient@example.com");
        entityManager.persist(recipient);
        entityManager.flush();

        Response createResponse = partyRepository.addParty(createPartyDto("public", List.of()), host.getId());
        assertEquals(201, createResponse.getStatus());

        Party party = entityManager
                .createQuery("SELECT p FROM Party p WHERE p.title = :title", Party.class)
                .setParameter("title", "Created Party")
                .getSingleResult();

        Response updateResponse = partyRepository.updateParty(
                party.getId(),
                createPartyDto("private", List.of(String.valueOf(recipient.getId()))),
                host.getId()
        );

        assertEquals(200, updateResponse.getStatus());

        Party updated = partyRepository.getPartyById(party.getId());
        assertEquals("PRIVATE", updated.getVisibility());
        assertEquals(1, updated.getInvitations().size());
    }
}
