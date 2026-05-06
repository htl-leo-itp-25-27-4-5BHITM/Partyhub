package at.htl.repository;

import at.htl.invitation.Invitation;
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
import java.util.Map;

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
    void testRemoveParty_notFound() {
        createTestData();
        
        Response response = partyRepository.removeParty(999L);
        assertEquals(404, response.getStatus());
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

        List<Invitation> invitations = entityManager
                .createQuery("SELECT i FROM Invitation i", Invitation.class)
                .getResultList();
        assertEquals(1, invitations.size());
        assertEquals(recipient.getId(), invitations.get(0).getRecipient().getId());
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

        List<Invitation> invitations = entityManager
                .createQuery("SELECT i FROM Invitation i WHERE i.party.id = :partyId", Invitation.class)
                .setParameter("partyId", party.getId())
                .getResultList();
        assertEquals(1, invitations.size());
        assertEquals(recipient.getId(), invitations.get(0).getRecipient().getId());

        List<Notification> notifications = entityManager
                .createQuery("SELECT n FROM Notification n WHERE n.party.id = :partyId", Notification.class)
                .setParameter("partyId", party.getId())
                .getResultList();
        assertEquals(1, notifications.size());
        assertEquals(recipient.getId(), notifications.get(0).getRecipient().getId());
    }

    @Test
    void testUpdatePrivatePartyDoesNotDuplicateExistingInvitation() {
        createTestData();
        User host = entityManager.createQuery("SELECT u FROM User u", User.class).getSingleResult();

        User recipient = new User();
        recipient.setDisplayName("Existing Recipient");
        recipient.setDistinctName("existing-recipient");
        recipient.setEmail("existing-recipient@example.com");
        entityManager.persist(recipient);
        entityManager.flush();

        Response createResponse = partyRepository.addParty(
                createPartyDto("private", List.of(String.valueOf(recipient.getId()))),
                host.getId()
        );
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

        Long invitationCount = entityManager
                .createQuery("SELECT COUNT(i) FROM Invitation i WHERE i.party.id = :partyId", Long.class)
                .setParameter("partyId", party.getId())
                .getSingleResult();
        assertEquals(1L, invitationCount);

        Long notificationCount = entityManager
                .createQuery("SELECT COUNT(n) FROM Notification n WHERE n.party.id = :partyId", Long.class)
                .setParameter("partyId", party.getId())
                .getSingleResult();
        assertEquals(2L, notificationCount);
    }

    @Test
    @SuppressWarnings("unchecked")
    void testAttendPartyInitializesEmptyAttendees() {
        createTestData();
        User user = entityManager.createQuery("SELECT u FROM User u", User.class).getSingleResult();
        Location location = entityManager.createQuery("SELECT l FROM Location l", Location.class).getSingleResult();

        Party party = new Party();
        party.setTitle("Joinable Party");
        party.setTheme("Test Theme");
        party.setLocation(location);
        party.setTime_start(LocalDateTime.now().plusDays(1));
        party.setTime_end(LocalDateTime.now().plusDays(1).plusHours(2));
        entityManager.persist(party);
        entityManager.flush();

        Response response = partyRepository.attendParty(party.getId(), user.getId());
        assertEquals(204, response.getStatus());

        Response status = partyRepository.attendStatus(party.getId(), user.getId());
        Map<String, Object> body = (Map<String, Object>) status.getEntity();
        assertEquals(true, body.get("attending"));
        assertEquals(1, body.get("count"));
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
