package at.htl.resource;

import at.htl.TestBase;
import at.htl.invitation.Invitation;
import at.htl.invitation.InvitationRepository;
import at.htl.location.Location;
import at.htl.party.Party;
import at.htl.user.User;
import at.htl.user.UserRepository;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
@Transactional
public class InvitationResourceTest extends TestBase {

    @Inject
    EntityManager em;

    @Inject
    UserRepository userRepository;

    private Long senderId;
    private Long recipientId;
    private Long invitationId;

    @BeforeEach
    void setUp() {
        em.createQuery("DELETE FROM UserNotificationSettings").executeUpdate();
        em.createQuery("DELETE FROM Notification").executeUpdate();
        em.createQuery("DELETE FROM Invitation").executeUpdate();
        em.createQuery("DELETE FROM Media").executeUpdate();
        em.createNativeQuery("DELETE FROM party_user").executeUpdate();
        em.createQuery("DELETE FROM Party").executeUpdate();
        em.createQuery("DELETE FROM Location").executeUpdate();
        em.createQuery("DELETE FROM User").executeUpdate();

        User sender = new User();
        sender.setUsername("invite-sender-" + System.nanoTime());
        sender.setDistinctName("invite-sender");
        userRepository.persist(sender);

        User recipient = new User();
        recipient.setUsername("invite-recipient-" + System.nanoTime());
        recipient.setDistinctName("invite-recipient");
        userRepository.persist(recipient);

        em.flush();
        senderId = sender.getId();
        recipientId = recipient.getId();

        Location loc = new Location();
        loc.setLatitude(48.3);
        loc.setLongitude(14.3);
        loc.setAddress("Test Address");
        em.persist(loc);
        em.flush();

        Party party = new Party();
        party.setTitle("Test Party");
        party.setHost_user(sender);
        party.setLocation(loc);
        party.setVisibility("PUBLIC");
        em.persist(party);
        em.flush();

        Invitation invitation = new Invitation();
        invitation.setParty(party);
        invitation.setRecipient(recipient);
        invitation.setSender(sender);
        invitation.setStatus("PENDING");
        em.persist(invitation);
        em.flush();

        invitationId = invitation.getId();
    }

    @Test
    void testGetReceivedInvites() {
        given()
            .header("X-User-Id", recipientId.toString())
            .when().get("/api/invitations")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testGetSentInvites() {
        given()
            .header("X-User-Id", senderId.toString())
            .queryParam("direction", "sent")
            .when().get("/api/invitations")
            .then()
            .statusCode(200)
            .body("$", is(notNullValue()));
    }

    @Test
    void testDeleteInvite_notFound() {
        given()
            .header("X-User-Id", recipientId.toString())
            .when().delete("/api/invitations/999")
            .then()
            .statusCode(404);
    }

    @Test
    void testGetReceivedInvites_noUser() {
        given()
            .when().get("/api/invitations")
            .then()
            .statusCode(401);
    }

    @Test
    void testGetInvitationDetails_recipient() {
        given()
            .header("X-User-Id", recipientId.toString())
            .when().get("/api/invitations/" + invitationId + "/details")
            .then()
            .statusCode(200)
            .body("invitationId", is(invitationId.intValue()));
    }

    @Test
    void testGetInvitationDetails_sender() {
        given()
            .header("X-User-Id", senderId.toString())
            .when().get("/api/invitations/" + invitationId + "/details")
            .then()
            .statusCode(200)
            .body("invitationId", is(invitationId.intValue()));
    }

    @Test
    void testGetInvitationDetails_unauthorized() {
        Long otherId = senderId + recipientId + 9999;
        given()
            .header("X-User-Id", otherId.toString())
            .when().get("/api/invitations/" + invitationId + "/details")
            .then()
            .statusCode(403);
    }

    @Test
    void testGetInvitationDetails_notFound() {
        given()
            .header("X-User-Id", recipientId.toString())
            .when().get("/api/invitations/99999/details")
            .then()
            .statusCode(404);
    }

    @Test
    void testAcceptInvitation() {
        given()
            .header("X-User-Id", recipientId.toString())
            .when().post("/api/invitations/" + invitationId + "/accept")
            .then()
            .statusCode(200);
    }

    @Test
    void testAcceptInvitation_unauthorized() {
        Long otherId = senderId + recipientId + 9999;
        given()
            .header("X-User-Id", otherId.toString())
            .when().post("/api/invitations/" + invitationId + "/accept")
            .then()
            .statusCode(403);
    }

    @Test
    void testDeclineInvitation() {
        given()
            .header("X-User-Id", recipientId.toString())
            .when().post("/api/invitations/" + invitationId + "/decline")
            .then()
            .statusCode(200);
    }

    @Test
    void testDeclineInvitation_unauthorized() {
        Long otherId = senderId + recipientId + 9999;
        given()
            .header("X-User-Id", otherId.toString())
            .when().post("/api/invitations/" + invitationId + "/decline")
            .then()
            .statusCode(403);
    }
}
