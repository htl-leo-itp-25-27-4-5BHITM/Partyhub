package at.htl.repository;

import at.htl.location.Location;
import at.htl.notification.Notification;
import at.htl.notification.NotificationRepository;
import at.htl.party.Party;
import at.htl.user.User;
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
public class NotificationRepositoryTest {

    @Inject
    NotificationRepository notificationRepository;

    @Inject
    EntityManager entityManager;

    @BeforeEach
    void setUp() {
        entityManager.createQuery("DELETE FROM Notification").executeUpdate();
        entityManager.createQuery("DELETE FROM Party").executeUpdate();
        entityManager.createQuery("DELETE FROM UserNotificationSettings").executeUpdate();
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

    private Party createParty(User host) {
        Location location = new Location();
        location.setAddress("Test Address");
        location.setLatitude(48.2082);
        location.setLongitude(16.3738);
        entityManager.persist(location);

        Party party = new Party();
        party.setTitle("Test Party");
        party.setHost_user(host);
        party.setLocation(location);
        entityManager.persist(party);
        entityManager.flush();
        return party;
    }

    @Test
    void testGetNotificationsByUser_empty() {
        User user = createUser("user1");
        List<Notification> notifications = notificationRepository.getNotificationsByUser(user.getId());
        assertNotNull(notifications);
        assertTrue(notifications.isEmpty());
    }

    @Test
    void testGetNotificationsByUser_withData() {
        User sender = createUser("sender2");
        User recipient = createUser("recipient2");
        Party party = createParty(sender);

        Notification notification = new Notification(recipient, sender, party, "Test message");
        notification.setStatus("UNREAD");
        entityManager.persist(notification);
        entityManager.flush();

        List<Notification> notifications = notificationRepository.getNotificationsByUser(recipient.getId());
        assertEquals(1, notifications.size());
        assertEquals("Test message", notifications.get(0).getMessage());
    }

    @Test
    void testGetNotificationsByUser_nullUserId() {
        List<Notification> notifications = notificationRepository.getNotificationsByUser(null);
        assertNotNull(notifications);
        assertTrue(notifications.isEmpty());
    }

    @Test
    void testGetUnreadNotifications_empty() {
        User user = createUser("user2");
        List<Notification> notifications = notificationRepository.getUnreadNotifications(user.getId());
        assertNotNull(notifications);
        assertTrue(notifications.isEmpty());
    }

    @Test
    void testGetUnreadNotifications_withUnread() {
        User sender = createUser("sender3");
        User recipient = createUser("recipient3");
        Party party = createParty(sender);

        Notification notification = new Notification(recipient, sender, party, "Unread message");
        notification.setStatus("UNREAD");
        entityManager.persist(notification);
        entityManager.flush();

        List<Notification> notifications = notificationRepository.getUnreadNotifications(recipient.getId());
        assertEquals(1, notifications.size());
    }

    @Test
    void testGetUnreadNotifications_nullUserId() {
        List<Notification> notifications = notificationRepository.getUnreadNotifications(null);
        assertNotNull(notifications);
        assertTrue(notifications.isEmpty());
    }

    @Test
    void testMarkAsRead_success() {
        User sender = createUser("sender3");
        User recipient = createUser("recipient3");

        Notification notification = new Notification(recipient, sender, null, "Mark read test");
        notification.setStatus("UNREAD");
        entityManager.persist(notification);
        entityManager.flush();

        Response response = notificationRepository.markAsRead(notification.getId(), recipient.getId());
        assertEquals(200, response.getStatus());

        Notification updated = entityManager.find(Notification.class, notification.getId());
        assertEquals("READ", updated.getStatus());
    }

    @Test
    void testMarkAsRead_notFound() {
        User user = createUser("user3");
        Response response = notificationRepository.markAsRead(999L, user.getId());
        assertEquals(404, response.getStatus());
    }

    @Test
    void testMarkAsRead_wrongUser() {
        User sender = createUser("sender4");
        User recipient = createUser("recipient4");
        User otherUser = createUser("other");

        Notification notification = new Notification(recipient, sender, null, "Wrong user test");
        entityManager.persist(notification);
        entityManager.flush();

        Response response = notificationRepository.markAsRead(notification.getId(), otherUser.getId());
        assertEquals(403, response.getStatus());
    }

    @Test
    void testMarkAsRead_nullParams() {
        Response response = notificationRepository.markAsRead(null, null);
        assertEquals(400, response.getStatus());

        Response response2 = notificationRepository.markAsRead(1L, null);
        assertEquals(400, response2.getStatus());
    }

    @Test
    void testDeleteNotification_success() {
        User sender = createUser("sender5");
        User recipient = createUser("recipient5");

        Notification notification = new Notification(recipient, sender, null, "Delete test");
        entityManager.persist(notification);
        entityManager.flush();

        Long id = notification.getId();
        Response response = notificationRepository.deleteNotification(id, recipient.getId());
        assertEquals(204, response.getStatus());
    }

    @Test
    void testDeleteNotification_notFound() {
        User user = createUser("user4");
        Response response = notificationRepository.deleteNotification(999L, user.getId());
        assertEquals(404, response.getStatus());
    }

    @Test
    void testDeleteNotification_wrongUser() {
        User sender = createUser("sender6");
        User recipient = createUser("recipient6");
        User otherUser = createUser("other2");

        Notification notification = new Notification(recipient, sender, null, "Wrong user delete");
        entityManager.persist(notification);
        entityManager.flush();

        Response response = notificationRepository.deleteNotification(notification.getId(), otherUser.getId());
        assertEquals(403, response.getStatus());
    }

    @Test
    void testDeleteNotification_protectedFollowAcceptedNotification() {
        User sender = createUser("sender-follow-accepted");
        User recipient = createUser("recipient-follow-accepted");

        Notification notification = new Notification(
                recipient,
                sender,
                null,
                "Sender accepted your follow request."
        );
        entityManager.persist(notification);
        entityManager.flush();

        Response response = notificationRepository.deleteNotification(notification.getId(), recipient.getId());
        assertEquals(403, response.getStatus());

        Notification stillThere = entityManager.find(Notification.class, notification.getId());
        assertNotNull(stillThere);
    }

    @Test
    void testDeleteByPartyId() {
        User host = createUser("host");
        Party party = createParty(host);

        Notification n1 = new Notification(host, host, party, "Notif 1");
        Notification n2 = new Notification(host, host, party, "Notif 2");
        entityManager.persist(n1);
        entityManager.persist(n2);
        entityManager.flush();

        int deleted = notificationRepository.deleteByPartyId(party.getId());
        assertEquals(2, deleted);
    }

    @Test
    void testDeleteByPartyId_noNotifications() {
        int deleted = notificationRepository.deleteByPartyId(999L);
        assertEquals(0, deleted);
    }

    @Test
    void testDeleteInvitationNotifications() {
        User sender = createUser("sender-invite");
        User recipient = createUser("recipient-invite");
        Party party = createParty(sender);

        Notification inviteNotification = new Notification(
                recipient,
                sender,
                party,
                "Sender invited you to the party \"Test Party\""
        );
        Notification updateNotification = new Notification(
                recipient,
                sender,
                party,
                "\"Test Party\" was updated. Check the new details in PartyHub."
        );
        entityManager.persist(inviteNotification);
        entityManager.persist(updateNotification);
        entityManager.flush();

        int deleted = notificationRepository.deleteInvitationNotifications(
                party.getId(),
                sender.getId(),
                recipient.getId()
        );

        assertEquals(1, deleted);

        List<Notification> remaining = notificationRepository.getNotificationsByUser(recipient.getId());
        assertEquals(1, remaining.size());
        assertTrue(remaining.get(0).getMessage().contains("updated"));
    }

    @Test
    void testCreateNotification() {
        User sender = createUser("sender7");
        User recipient = createUser("recipient7");

        Notification notification = new Notification(recipient, sender, null, "Create test");
        notificationRepository.createNotification(notification);
        entityManager.flush();

        assertNotNull(notification.getId());
        assertTrue(notification.getId() > 0);
    }
}
