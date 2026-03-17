package at.htl.repository;

import at.htl.category.Category;
import at.htl.invitation.Invitation;
import at.htl.invitation.InvitationDto;
import at.htl.invitation.InvitationRepository;
import at.htl.location.Location;
import at.htl.party.Party;
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
public class InvitationRepositoryTest {

    @Inject
    InvitationRepository invitationRepository;

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
        entityManager.createQuery("DELETE FROM Category").executeUpdate();
        entityManager.createQuery("DELETE FROM Location").executeUpdate();
        entityManager.createQuery("DELETE FROM FollowStatus").executeUpdate();
    }

    private User createTestUser(String name, String distinctName) {
        User user = new User();
        user.setDisplayName(name);
        user.setDistinctName(distinctName);
        user.setEmail(name.toLowerCase().replace(" ", ".") + "@example.com");
        entityManager.persist(user);
        return user;
    }

    private Party createTestParty(User host) {
        Category category = new Category();
        category.setName("Test Category");
        entityManager.persist(category);

        Location location = new Location();
        location.setAddress("Test Address");
        location.setLatitude(48.2082);
        location.setLongitude(16.3738);
        entityManager.persist(location);

        Party party = new Party();
        party.setTitle("Test Party");
        party.setDescription("Test Description");
        party.setCategory(category);
        party.setLocation(location);
        party.setTime_start(LocalDateTime.now());
        party.setTime_end(LocalDateTime.now().plusHours(2));
        party.setMax_people(50);
        party.setMin_age(18);
        party.setMax_age(35);
        party.setHost_user(host);
        entityManager.persist(party);
        
        return party;
    }

    @Test
    void testInvite_success() {
        User sender = createTestUser("Sender User", "sender");
        User recipient = createTestUser("Recipient User", "recipient");
        entityManager.flush();

        Party party = createTestParty(sender);

        InvitationDto dto = new InvitationDto(party.getId(), recipient.getId());
        Response response = invitationRepository.invite(dto, sender.getId());
        
        assertEquals(201, response.getStatus());
        
        List<Invitation> invitations = entityManager.createQuery("SELECT i FROM Invitation i", Invitation.class).getResultList();
        assertEquals(1, invitations.size());
    }

    @Test
    void testInvite_noUser() {
        User recipient = createTestUser("Recipient User", "recipient");
        entityManager.flush();

        Party party = createTestParty(recipient);

        InvitationDto dto = new InvitationDto(party.getId(), recipient.getId());
        Response response = invitationRepository.invite(dto, null);
        
        assertEquals(200, response.getStatus());
    }

    @Test
    void testDeleteInvite_success() {
        User sender = createTestUser("Sender User", "sender");
        User recipient = createTestUser("Recipient User", "recipient");
        entityManager.flush();

        Party party = createTestParty(sender);

        InvitationDto dto = new InvitationDto(party.getId(), recipient.getId());
        invitationRepository.invite(dto, sender.getId());
        entityManager.flush();

        List<Invitation> invitations = entityManager.createQuery("SELECT i FROM Invitation i", Invitation.class).getResultList();
        assertEquals(1, invitations.size());

        Response response = invitationRepository.deleteInvite(invitations.get(0).getId(), sender.getId());
        assertEquals(204, response.getStatus());

        List<Invitation> afterDelete = entityManager.createQuery("SELECT i FROM Invitation i", Invitation.class).getResultList();
        assertTrue(afterDelete.isEmpty());
    }

    @Test
    void testDeleteInvite_notFound() {
        User sender = createTestUser("Sender User", "sender");
        createTestUser("Recipient User", "recipient");
        entityManager.flush();
        createTestParty(sender);

        Response response = invitationRepository.deleteInvite(999L, sender.getId());
        assertEquals(404, response.getStatus());
    }
}
