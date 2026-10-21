package at.htl.resource;

import at.htl.TestBase;
import at.htl.invitation.Invitation;
import at.htl.location.Location;
import at.htl.media.Media;
import at.htl.party.Party;
import at.htl.user.User;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashSet;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Party gallery over HTTP: upload, item serving, list visibility and deletion
 * (openspec/specs/party-media-gallery/spec.md).
 */
@QuarkusTest
public class MediaResourceTest extends TestBase {

    static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13, 'I', 'H', 'D', 'R'};
    static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16, 'J', 'F', 'I', 'F'};

    @Inject
    EntityManager em;

    @ConfigProperty(name = "partyhub.media.upload-dir")
    String uploadDir;

    Long publicPartyId;
    Long privatePartyId;
    Long attendeeId;
    Long inviteeId;

    @BeforeEach
    void setUp() throws IOException {
        QuarkusTransaction.requiringNew().run(() -> {
            em.createQuery("DELETE FROM Notification").executeUpdate();
            em.createQuery("DELETE FROM Invitation").executeUpdate();
            em.createQuery("DELETE FROM Media").executeUpdate();
            em.createQuery("DELETE FROM UserLocation").executeUpdate();
            em.createQuery("DELETE FROM Party").executeUpdate();
            em.createQuery("DELETE FROM UserNotificationSettings").executeUpdate();
            em.createQuery("DELETE FROM User").executeUpdate();
            em.createQuery("DELETE FROM Location").executeUpdate();

            User host = user("host");
            User invitee = user("invitee");
            User attendee = user("attendee");
            user("stranger");

            Location location = new Location();
            location.setAddress("Test Address");
            location.setLatitude(48.3);
            location.setLongitude(14.3);
            em.persist(location);

            publicPartyId = party("PUBLIC", host, attendee, location).getId();
            Party privateParty = party("PRIVATE", host, attendee, location);
            privatePartyId = privateParty.getId();
            attendeeId = attendee.getId();
            inviteeId = invitee.getId();

            Invitation invitation = new Invitation();
            invitation.setParty(privateParty);
            invitation.setSender(host);
            invitation.setRecipient(invitee);
            invitation.setStatus("PENDING");
            em.persist(invitation);
        });
        // H2 restarts its IDs on each run; files from an earlier run can
        // otherwise be mistaken for uploads made by this test.
        removePartyFiles(publicPartyId);
        removePartyFiles(privatePartyId);
    }

    // Other test classes delete parties without deleting invitations first.
    @AfterEach
    void removeInvitationsAndMedia() {
        QuarkusTransaction.requiringNew().run(() -> {
            em.createQuery("DELETE FROM Invitation").executeUpdate();
            em.createQuery("DELETE FROM Media").executeUpdate();
        });
    }

    @AfterEach
    void removeUploadedFiles() throws IOException {
        removePartyFiles(publicPartyId);
        removePartyFiles(privatePartyId);
    }

    private void removePartyFiles(Long partyId) throws IOException {
        if (partyId == null) return;
        Path directory = Paths.get(uploadDir, "party" + partyId);
        if (!Files.exists(directory)) return;
        try (Stream<Path> paths = Files.walk(directory)) {
            paths.filter(Files::isDirectory).forEach(dir -> dir.toFile().setWritable(true));
        }
        try (Stream<Path> paths = Files.walk(directory)) {
            for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) {
                Files.deleteIfExists(path);
            }
        }
    }

    private User user(String name) {
        User user = new User();
        user.setDisplayName(name);
        user.setDistinctName(name);
        user.setEmail(name + "@example.com");
        user.setKeycloakId(name + "-sub");
        em.persist(user);
        return user;
    }

    private Party party(String visibility, User host, User attendee, Location location) {
        Party party = new Party();
        party.setTitle(visibility + " party");
        party.setHost_user(host);
        party.setLocation(location);
        party.setVisibility(visibility);
        party.setTime_start(java.time.LocalDateTime.now());
        party.setTime_end(java.time.LocalDateTime.now().plusHours(4));
        party.setUsers(new HashSet<>(Set.of(attendee)));
        em.persist(party);
        return party;
    }

    private long mediaCount(Long partyId) {
        return QuarkusTransaction.requiringNew().call(() -> em.createQuery(
                        "SELECT COUNT(m) FROM Media m WHERE m.party.id = :partyId", Long.class)
                .setParameter("partyId", partyId)
                .getSingleResult());
    }

    private List<Path> storedFiles(Long partyId) throws IOException {
        Path dir = Paths.get(uploadDir, "party" + partyId);
        if (!Files.exists(dir)) {
            return List.of();
        }
        try (Stream<Path> files = Files.list(dir)) {
            return files.toList();
        }
    }

    /** Stores a media row plus its backing file, committed, and returns the media id. */
    private Long storedMedia(Long partyId, byte[] content) throws IOException {
        return storedMedia(partyId, content, attendeeId);
    }

    private Long storedMedia(Long partyId, byte[] content, Long uploaderId) throws IOException {
        Path dir = Files.createDirectories(Paths.get(uploadDir, "party" + partyId));
        String name = "fixture-" + System.nanoTime() + ".img";
        Files.write(dir.resolve(name), content);
        return QuarkusTransaction.requiringNew().call(() -> {
            Media media = new Media(em.find(Party.class, partyId), em.find(User.class, uploaderId),
                    "party" + partyId + "/" + name);
            em.persist(media);
            return media.getId();
        });
    }

    private boolean mediaExists(Long mediaId) {
        return QuarkusTransaction.requiringNew().call(() -> em.find(Media.class, mediaId) != null);
    }

    // ---------- Upload ----------

    @Test
    void upload_anonymous_isRejected() {
        given()
            .multiPart("file", "photo.png", PNG, "image/png")
            .when().post("/api/parties/{id}/media/upload", publicPartyId)
            .then()
            .statusCode(401);
        assertEquals(0, mediaCount(publicPartyId));
    }

    @Test
    @TestSecurity(user = "attendee-sub")
    void upload_withoutFilePart_isRejectedByValidation() {
        given()
            .multiPart("other", "not a file")
            .when().post("/api/parties/{id}/media/upload", publicPartyId)
            .then()
            .statusCode(400);
        assertEquals(0, mediaCount(publicPartyId));
    }

    @Test
    @TestSecurity(user = "stranger-sub")
    void upload_nonViewerOfPrivateParty_isRejectedWithoutSideEffects() throws IOException {
        given()
            .multiPart("file", "photo.png", PNG, "image/png")
            .when().post("/api/parties/{id}/media/upload", privatePartyId)
            .then()
            .statusCode(404);
        assertEquals(0, mediaCount(privatePartyId));
        assertTrue(storedFiles(privatePartyId).isEmpty());
    }

    @Test
    @TestSecurity(user = "attendee-sub")
    void upload_joinedAttendeeOfPrivateParty_isAccepted() throws IOException {
        given()
            .multiPart("file", "photo.png", PNG, "image/png")
            .when().post("/api/parties/{id}/media/upload", privatePartyId)
            .then()
            .statusCode(200)
            .body("size()", is(1))
            .body("[0].partyId", is(privatePartyId.intValue()));
        assertEquals(1, mediaCount(privatePartyId));
        assertEquals(1, storedFiles(privatePartyId).size());
    }

    @Test
    @TestSecurity(user = "invitee-sub")
    void upload_typeComesFromContentNotFromClient() throws IOException {
        given()
            .multiPart("file", "holiday.jpg", PNG, "text/plain")
            .when().post("/api/parties/{id}/media/upload", privatePartyId)
            .then()
            .statusCode(200);
        List<Path> files = storedFiles(privatePartyId);
        assertEquals(1, files.size());
        assertTrue(files.get(0).getFileName().toString().endsWith(".png"), files.get(0).toString());
    }

    @Test
    @TestSecurity(user = "attendee-sub")
    void upload_nonImageWithImageName_isRejected() {
        given()
            .multiPart("file", "photo.jpg", "<html>not an image</html>".getBytes(), "image/jpeg")
            .when().post("/api/parties/{id}/media/upload", publicPartyId)
            .then()
            .statusCode(400);
        assertEquals(0, mediaCount(publicPartyId));
    }

    @Test
    @TestSecurity(user = "attendee-sub")
    void upload_emptyFile_isRejected() {
        given()
            .multiPart("file", "empty.png", new byte[0], "image/png")
            .when().post("/api/parties/{id}/media/upload", publicPartyId)
            .then()
            .statusCode(400);
        assertEquals(0, mediaCount(publicPartyId));
    }

    @Test
    @TestSecurity(user = "attendee-sub")
    void upload_overFiveMebibytes_isRejected() {
        byte[] big = new byte[5 * 1024 * 1024 + 1];
        System.arraycopy(PNG, 0, big, 0, PNG.length);
        given()
            .multiPart("file", "big.png", big, "image/png")
            .when().post("/api/parties/{id}/media/upload", publicPartyId)
            .then()
            .statusCode(400);
        assertEquals(0, mediaCount(publicPartyId));
    }

    @Test
    @TestSecurity(user = "attendee-sub")
    void upload_oneInvalidFile_rejectsTheWholeRequest() throws IOException {
        given()
            .multiPart("file", "good.png", PNG, "image/png")
            .multiPart("file", "bad.jpg", "nope".getBytes(), "image/jpeg")
            .when().post("/api/parties/{id}/media/upload", publicPartyId)
            .then()
            .statusCode(400);
        assertEquals(0, mediaCount(publicPartyId));
        assertTrue(storedFiles(publicPartyId).isEmpty());
    }

    @Test
    @TestSecurity(user = "attendee-sub")
    void upload_unsafeClientFilename_isStoredUnderServerName() throws IOException {
        given()
            .multiPart("file", "../../evil.jpg", JPEG, "image/jpeg")
            .when().post("/api/parties/{id}/media/upload", publicPartyId)
            .then()
            .statusCode(200);
        List<Path> files = storedFiles(publicPartyId);
        assertEquals(1, files.size());
        assertTrue(files.get(0).getFileName().toString().matches("[0-9a-f-]{36}\\.jpg"), files.get(0).toString());
        assertFalse(Files.exists(Paths.get(uploadDir).getParent().resolve("evil.jpg")));
    }

    @Test
    @TestSecurity(user = "attendee-sub")
    void upload_storageFailure_createsNoMediaRecord() throws IOException {
        Path dir = Files.createDirectories(Paths.get(uploadDir, "party" + publicPartyId));
        assertTrue(dir.toFile().setWritable(false));

        given()
            .multiPart("file", "photo.png", PNG, "image/png")
            .when().post("/api/parties/{id}/media/upload", publicPartyId)
            .then()
            .statusCode(500);
        assertEquals(0, mediaCount(publicPartyId));
    }

    // ---------- Serving ----------

    @Test
    void serve_publicPartyItem_anonymous() throws IOException {
        Long mediaId = storedMedia(publicPartyId, PNG);
        byte[] body = given()
            .when().get("/api/media/{id}", mediaId)
            .then()
            .statusCode(200)
            .contentType("image/png")
            .header("X-Content-Type-Options", "nosniff")
            .extract().asByteArray();
        assertArrayEquals(PNG, body);
    }

    @Test
    void serve_privatePartyItem_anonymous_isNotFound() throws IOException {
        Long mediaId = storedMedia(privatePartyId, PNG);
        given().when().get("/api/media/{id}", mediaId).then().statusCode(404);
    }

    @Test
    @TestSecurity(user = "stranger-sub")
    void serve_privatePartyItem_unrelatedUser_isNotFound() throws IOException {
        Long mediaId = storedMedia(privatePartyId, PNG);
        given().when().get("/api/media/{id}", mediaId).then().statusCode(404);
    }

    @Test
    @TestSecurity(user = "host-sub")
    void serve_privatePartyItem_host() throws IOException {
        Long mediaId = storedMedia(privatePartyId, JPEG);
        given().when().get("/api/media/{id}", mediaId).then().statusCode(200).contentType("image/jpeg");
    }

    @Test
    @TestSecurity(user = "invitee-sub")
    void serve_privatePartyItem_pendingInvitee() throws IOException {
        Long mediaId = storedMedia(privatePartyId, PNG);
        given().when().get("/api/media/{id}", mediaId).then().statusCode(200);
    }

    @Test
    @TestSecurity(user = "attendee-sub")
    void serve_privatePartyItem_joinedAttendee() throws IOException {
        Long mediaId = storedMedia(privatePartyId, PNG);
        given().when().get("/api/media/{id}", mediaId).then().statusCode(200);
    }

    @Test
    void serve_rowWithoutBackingFile_isNotFound() {
        Long mediaId = QuarkusTransaction.requiringNew().call(() -> {
            Media media = new Media(em.find(Party.class, publicPartyId), em.find(User.class, attendeeId),
                    "party" + publicPartyId + "/missing.png");
            em.persist(media);
            return media.getId();
        });
        given().when().get("/api/media/{id}", mediaId).then().statusCode(404);
    }

    @Test
    void serve_unknownId_isNotFound() {
        given().when().get("/api/media/999999").then().statusCode(404);
    }

    // ---------- Lists ----------

    @Test
    void partyList_privateParty_anonymous_isNotFound() {
        given().when().get("/api/parties/{id}/media", privatePartyId).then().statusCode(404);
    }

    @Test
    @TestSecurity(user = "stranger-sub")
    void partyList_privateParty_unrelatedUser_isNotFound() {
        given().when().get("/api/parties/{id}/media", privatePartyId).then().statusCode(404);
    }

    @Test
    @TestSecurity(user = "attendee-sub")
    void partyList_privateParty_viewerGetsIdentitiesOnly() throws IOException {
        Long mediaId = storedMedia(privatePartyId, PNG);
        given()
            .when().get("/api/parties/{id}/media", privatePartyId)
            .then()
            .statusCode(200)
            .body("size()", is(1))
            .body("[0].id", is(mediaId.intValue()))
            .body("[0]", not(hasKey("url")));
    }

    @Test
    @TestSecurity(user = "stranger-sub")
    void userList_omitsPrivatePartyItemsForUnrelatedCaller() throws IOException {
        Long publicItem = storedMedia(publicPartyId, PNG);
        storedMedia(privatePartyId, PNG);
        given()
            .when().get("/api/users/{id}/media", attendeeId)
            .then()
            .statusCode(200)
            .body("id", contains(publicItem.intValue()));
    }

    // ---------- Delete permission flag ----------

    @Test
    @TestSecurity(user = "attendee-sub")
    void partyList_uploaderSeesOnlyOwnItemsAsDeletable() throws IOException {
        Long own = storedMedia(publicPartyId, PNG, attendeeId);
        Long others = storedMedia(publicPartyId, PNG, inviteeId);
        given()
            .when().get("/api/parties/{id}/media", publicPartyId)
            .then()
            .statusCode(200)
            .body("find { it.id == %s }.canDelete".formatted(own), is(true))
            .body("find { it.id == %s }.canDelete".formatted(others), is(false));
    }

    @Test
    @TestSecurity(user = "host-sub")
    void partyList_hostSeesEveryItemAsDeletable() throws IOException {
        storedMedia(publicPartyId, PNG, attendeeId);
        storedMedia(publicPartyId, PNG, inviteeId);
        given()
            .when().get("/api/parties/{id}/media", publicPartyId)
            .then()
            .statusCode(200)
            .body("canDelete", everyItem(is(true)));
    }

    @Test
    void partyList_anonymousSeesNothingAsDeletable() throws IOException {
        storedMedia(publicPartyId, PNG);
        given()
            .when().get("/api/parties/{id}/media", publicPartyId)
            .then()
            .statusCode(200)
            .body("size()", is(1))
            .body("canDelete", everyItem(is(false)));
    }

    @Test
    @TestSecurity(user = "attendee-sub")
    void upload_responseMarksNewItemsDeletableForUploader() {
        given()
            .multiPart("file", "photo.png", PNG, "image/png")
            .when().post("/api/parties/{id}/media/upload", publicPartyId)
            .then()
            .statusCode(200)
            .body("[0].canDelete", is(true));
    }

    // ---------- Delete ----------

    @Test
    @TestSecurity(user = "attendee-sub")
    void delete_uploaderRemovesRowAndFile() throws IOException {
        Long mediaId = storedMedia(privatePartyId, PNG, attendeeId);
        given().when().delete("/api/media/{id}", mediaId).then().statusCode(204);
        assertFalse(mediaExists(mediaId));
        assertTrue(storedFiles(privatePartyId).isEmpty());
        given().when().get("/api/media/{id}", mediaId).then().statusCode(404);
    }

    @Test
    @TestSecurity(user = "host-sub")
    void delete_hostRemovesAnotherUsersItem() throws IOException {
        Long mediaId = storedMedia(publicPartyId, PNG, attendeeId);
        given().when().delete("/api/media/{id}", mediaId).then().statusCode(204);
        assertFalse(mediaExists(mediaId));
        assertTrue(storedFiles(publicPartyId).isEmpty());
    }

    @Test
    @TestSecurity(user = "invitee-sub")
    void delete_otherViewer_isForbiddenAndKeepsItem() throws IOException {
        Long mediaId = storedMedia(privatePartyId, PNG, attendeeId);
        given().when().delete("/api/media/{id}", mediaId).then().statusCode(403);
        assertTrue(mediaExists(mediaId));
        assertEquals(1, storedFiles(privatePartyId).size());
    }

    @Test
    void delete_anonymous_isRejected() throws IOException {
        Long mediaId = storedMedia(publicPartyId, PNG);
        given().when().delete("/api/media/{id}", mediaId).then().statusCode(401);
        assertTrue(mediaExists(mediaId));
        assertEquals(1, storedFiles(publicPartyId).size());
    }

    @Test
    @TestSecurity(user = "stranger-sub")
    void delete_nonViewerOfPrivateParty_isNotFound() throws IOException {
        Long mediaId = storedMedia(privatePartyId, PNG);
        given().when().delete("/api/media/{id}", mediaId).then().statusCode(404);
        assertTrue(mediaExists(mediaId));
        assertEquals(1, storedFiles(privatePartyId).size());
    }

    @Test
    @TestSecurity(user = "host-sub")
    void delete_unknownId_isNotFound() {
        given().when().delete("/api/media/999999").then().statusCode(404);
    }

    @Test
    @TestSecurity(user = "attendee-sub")
    void delete_rowWithoutBackingFile_stillSucceeds() {
        Long mediaId = QuarkusTransaction.requiringNew().call(() -> {
            Media media = new Media(em.find(Party.class, publicPartyId), em.find(User.class, attendeeId),
                    "party" + publicPartyId + "/missing.png");
            em.persist(media);
            return media.getId();
        });
        given().when().delete("/api/media/{id}", mediaId).then().statusCode(204);
        assertFalse(mediaExists(mediaId));
    }

    @Test
    @TestSecurity(user = "attendee-sub")
    void delete_removedItemDisappearsFromLists() throws IOException {
        Long kept = storedMedia(publicPartyId, PNG, attendeeId);
        Long removed = storedMedia(publicPartyId, PNG, attendeeId);
        given().when().delete("/api/media/{id}", removed).then().statusCode(204);
        given().when().get("/api/parties/{id}/media", publicPartyId).then().body("id", contains(kept.intValue()));
        given().when().get("/api/users/{id}/media", attendeeId).then().body("id", contains(kept.intValue()));
    }
}
