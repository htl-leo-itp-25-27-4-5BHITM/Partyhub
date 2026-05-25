package at.htl.notification;

import at.htl.TestBase;
import at.htl.user.User;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.MockMailbox;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class OutOfAppNotificationServiceTest extends TestBase {

    @Inject
    OutOfAppNotificationService service;

    @Inject
    MockMailbox mailbox;

    @BeforeEach
    void clearMailbox() {
        mailbox.clear();
    }

    @Test
    void testSendEmail() {
        User recipient = new User();
        recipient.setEmail("test@example.com");
        recipient.setId(999L);

        service.send(recipient, "Test Subject", "Hello from PartyHub!");

        List<Mail> sent = mailbox.getMessagesSentTo("test@example.com");
        assertEquals(1, sent.size());
        Mail mail = sent.get(0);
        assertEquals("Test Subject", mail.getSubject());
        assertTrue(mail.getText().contains("Hello from PartyHub!"));
    }

    @Test
    void testSendEmail_noEmail_skips() {
        User recipient = new User();
        recipient.setId(999L);

        service.send(recipient, "Subject", "Message");

        List<Mail> sent = mailbox.getMessagesSentTo("test@example.com");
        assertTrue(sent.isEmpty());
    }

    @Test
    void testSendEmail_nullRecipient_skips() {
        service.send(null, "Subject", "Message");

        assertTrue(mailbox.getTotalMessagesSent() == 0);
    }

    @Test
    void testSendEmail_blankMessage_skips() {
        User recipient = new User();
        recipient.setEmail("test@example.com");

        service.send(recipient, "Subject", "   ");

        assertTrue(mailbox.getTotalMessagesSent() == 0);
    }

    @Test
    void testSendNotification() {
        User recipient = new User();
        recipient.setEmail("notif@example.com");
        recipient.setId(999L);

        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setMessage("You have a new notification!");

        service.sendNotification(notification);

        List<Mail> sent = mailbox.getMessagesSentTo("notif@example.com");
        assertEquals(1, sent.size());
    }
}
