package at.htl.resource;

import at.htl.TestBase;
import at.htl.user.User;
import at.htl.party.Party;
import at.htl.location.Location;
import at.htl.invitation.Invitation;
import at.htl.notification.Notification;
import at.htl.notificationsettings.UserNotificationSettings;
import at.htl.follow.Follow;
import at.htl.follow.FollowStatus;
import at.htl.media.Media;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import java.util.Map;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class AccessControlResourceTest extends TestBase {
    @Inject EntityManager em;
    Long host, attacker, recipient, party, invitation, notification, media;
    final String edit = "{\"title\":\"Changed by caller\",\"time_start\":\"2027-01-20T18:00:00\",\"latitude\":48.3,\"longitude\":14.3,\"visibility\":\"PRIVATE\"}";

    User user(String sub) {
        var found=em.createQuery("select u from User u where u.keycloakId=:sub",User.class).setParameter("sub",sub).getResultList();
        if(!found.isEmpty()) return found.getFirst();
        User u=new User();u.setKeycloakId(sub);u.setDisplayName(sub);u.setDistinctName(sub);u.setEmail(sub+"@example.test");
        em.persist(u);em.persist(new UserNotificationSettings(u));return u;
    }

    void follow(Long a, Long b, FollowStatus status) {
        long count=em.createQuery("select count(f) from Follow f where f.user1_id=:a and f.user2_id=:b",Long.class)
                .setParameter("a",a).setParameter("b",b).getSingleResult();
        if(count>0) return;
        Follow f=new Follow();f.setUser1_id(a);f.setUser2_id(b);f.setStatus(status);em.persist(f);
    }

    @BeforeEach void fixtures() {
        QuarkusTransaction.requiringNew().run(()->{
            User h=user("access-host"),a=user("access-attacker"),r=user("access-recipient");em.flush();
            host=h.getId();attacker=a.getId();recipient=r.getId();
            FollowStatus status=em.find(FollowStatus.class,2L);
            if(status==null){status=new FollowStatus();status.setStatus_id(2L);status.setName("ACCEPTED");em.persist(status);}
            follow(host,recipient,status);follow(recipient,host,status);
            Location l=new Location();l.setAddress("Private address");l.setLatitude(48.3);l.setLongitude(14.3);em.persist(l);
            Party p=new Party();p.setTitle("Owner party");p.setHost_user(h);p.setVisibility("PRIVATE");p.setLocation(l);p.setTime_start(LocalDateTime.now().plusDays(2));em.persist(p);
            Invitation i=new Invitation();i.setParty(p);i.setSender(h);i.setRecipient(r);i.setStatus("PENDING");em.persist(i);
            Notification n=new Notification(h,r,p,"Private notification");em.persist(n);
            Media m=new Media();m.setParty(p);m.setUser(h);m.setFile("access-fixture.png");em.persist(m);em.flush();
            party=p.getId();invitation=i.getId();notification=n.getId();media=m.getId();
        });
    }

    @Test @TestSecurity(user="access-attacker")
    void cannotChangeSomeoneElsesPartyOrProfile() {
        given().contentType("application/json").body(edit).put("/api/parties/"+party).then().statusCode(403);
        given().delete("/api/parties/"+party).then().statusCode(403);
        given().contentType("application/json").body(Map.of("displayName","Stolen")).put("/api/users/"+host).then().statusCode(403);
        given().get("/api/users/"+host+"/notification-settings").then().statusCode(403);
        given().contentType("application/json").body("{}").put("/api/users/"+host+"/notification-settings").then().statusCode(403);
        given().get("/api/users/"+host+"/follow-requests").then().statusCode(403);
        QuarkusTransaction.requiringNew().run(()->{
            assertEquals("Owner party",em.find(Party.class,party).getTitle());
            assertEquals(host,em.find(Party.class,party).getHost_user().getId());
            assertEquals("access-host",em.find(User.class,host).getDisplayName());
        });
    }

    @Test @TestSecurity(user="access-attacker")
    void cannotInviteThemselvesOrActOnAnotherRecipientsInvitation() {
        given().contentType("application/json").body(Map.of("recipient",attacker,"partyId",party)).post("/api/invitations").then().statusCode(403);
        given().post("/api/invitations/"+invitation+"/accept").then().statusCode(403);
        given().post("/api/invitations/"+invitation+"/decline").then().statusCode(403);
        given().get("/api/invitations/"+invitation+"/details").then().statusCode(403);
        given().delete("/api/invitations/"+invitation).then().statusCode(403);
        QuarkusTransaction.requiringNew().run(()->assertEquals("PENDING",em.find(Invitation.class,invitation).getStatus()));
    }

    @Test @TestSecurity(user="access-attacker")
    void privateReadsMediaAndNotificationsStayPrivate() {
        for(String suffix:new String[]{"","/can-edit","/media","/favorite","/invited-members","/joined-members","/invitation-stats"})
            given().get("/api/parties/"+party+suffix).then().statusCode(404);
        given().put("/api/parties/"+party+"/favorite").then().statusCode(404);
        given().get("/api/media/"+media).then().statusCode(404);
        given().delete("/api/media/"+media).then().statusCode(404);
        given().post("/api/notifications/"+notification+"/read").then().statusCode(403);
        given().delete("/api/notifications/"+notification).then().statusCode(403);
        given().get("/api/users/"+host).then().statusCode(200).body("email",nullValue()).body("phoneNumber",nullValue());
        QuarkusTransaction.requiringNew().run(()->assertEquals("UNREAD",em.find(Notification.class,notification).getStatus()));
    }

    @Test @TestSecurity(user="access-host")
    void legitimateOwnerCanEditButCannotInviteNonMutualContacts() {
        given().contentType("application/json").body(edit).put("/api/parties/"+party).then().statusCode(200);
        given().contentType("application/json").body(Map.of("recipient",attacker,"partyId",party)).post("/api/invitations").then().statusCode(403);
        long before=QuarkusTransaction.requiringNew().call(()->em.createQuery("select count(p) from Party p",Long.class).getSingleResult());
        given().contentType("application/json").body(edit.replace("\"visibility\"", "\"selectedUsers\":[\""+attacker+"\"],\"visibility\""))
                .post("/api/parties").then().statusCode(400);
        long after=QuarkusTransaction.requiringNew().call(()->em.createQuery("select count(p) from Party p",Long.class).getSingleResult());
        assertEquals(before,after);
        given().get("/api/parties/"+party).then().statusCode(200);
        given().contentType("application/json").body(Map.of("displayName","Owner updated")).put("/api/users/"+host).then().statusCode(200);
        // Reset the shared owner fixture so later methods can verify unchanged data.
        QuarkusTransaction.requiringNew().run(()->em.find(User.class,host).setDisplayName("access-host"));
    }

    @Test @TestSecurity(user="access-recipient")
    void intendedRecipientCanAcceptTheirInvitation() {
        given().post("/api/invitations/"+invitation+"/accept").then().statusCode(200);
        given().get("/api/parties/"+party).then().statusCode(200);
    }

    @Test @TestSecurity(user="access-attacker")
    void sqlPayloadsStayDataAndCannotExposePrivateRecords() {
        for(String payload:new String[]{"' OR 1=1 --", "'; DROP TABLE users; --", "x' UNION SELECT * FROM users --"}) {
            given().queryParam("q",payload).get("/api/parties").then().statusCode(200).body("id",not(hasItem(party.intValue())));
            given().queryParam("q",payload).get("/api/users").then().statusCode(200).body("size()",is(0));
        }
        String text="'; DROP TABLE users; --";
        given().contentType("application/json").body(Map.of("biography",text)).put("/api/users/"+attacker).then().statusCode(200).body("biography",equalTo(text));
        given().get("/api/users/"+host).then().statusCode(200);
        given().delete("/api/users/"+host+"/followers/"+recipient).then().statusCode(403);
        given().post("/api/notifications/read-all").then().statusCode(200);
        QuarkusTransaction.requiringNew().run(()->assertEquals("UNREAD",em.find(Notification.class,notification).getStatus()));
    }

    @Test @TestSecurity(user="access-attacker")
    void followActorInThePathMustMatchTheCaller() {
        given().queryParam("targetUserId",recipient).post("/api/users/"+host+"/follow").then().statusCode(403);
        given().put("/api/users/"+host+"/followers/"+recipient).then().statusCode(403);
        given().queryParam("targetUserId",host).post("/api/users/"+attacker+"/follow").then().statusCode(201);
    }

    @Test @TestSecurity(user="access-attacker")
    void callersCannotManufactureOtherIdentityRecords() {
        long before=QuarkusTransaction.requiringNew().call(()->em.createQuery("select count(u) from User u",Long.class).getSingleResult());
        given().contentType("application/json").body(Map.of("displayName","Forged","email","victim@example.test"))
                .post("/api/users").then().statusCode(403);
        long after=QuarkusTransaction.requiringNew().call(()->em.createQuery("select count(u) from User u",Long.class).getSingleResult());
        assertEquals(before,after);
    }

    @Test void anonymousAndForgedBearerRequestsCannotWrite() {
        given().contentType("application/json").body(edit).put("/api/parties/"+party).then().statusCode(401);
        given().contentType("application/json").body("{}").post("/api/users").then().statusCode(401);
        given().header("Authorization","Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.").get("/api/users/me").then().statusCode(401);
    }
}
