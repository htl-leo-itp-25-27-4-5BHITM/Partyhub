package at.htl.repository;

import at.htl.invitation.Invitation;
import at.htl.location.Location;
import at.htl.media.ImageType;
import at.htl.media.Media;
import at.htl.media.MediaDto;
import at.htl.media.MediaRepository;
import at.htl.party.Party;
import at.htl.user.User;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
@Transactional
public class MediaRepositoryTest {

    static final byte[] PNG_BYTES = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};

    @Inject
    MediaRepository mediaRepository;

    @Inject
    EntityManager entityManager;

    @ConfigProperty(name = "partyhub.media.upload-dir")
    String uploadDir;

    User host;
    User invitee;
    User attendee;
    User stranger;
    Location location;

    @BeforeEach
    void setUp() {
        entityManager.createQuery("DELETE FROM Notification").executeUpdate();
        entityManager.createQuery("DELETE FROM Invitation").executeUpdate();
        entityManager.createQuery("DELETE FROM Media").executeUpdate();
        entityManager.createQuery("DELETE FROM Party").executeUpdate();
        entityManager.createQuery("DELETE FROM UserNotificationSettings").executeUpdate();
        entityManager.createQuery("DELETE FROM User").executeUpdate();
        entityManager.createQuery("DELETE FROM Location").executeUpdate();
    }

    // Other test classes delete parties without deleting invitations first.
    @AfterEach
    void removeInvitationsAndMedia() {
        entityManager.createQuery("DELETE FROM Invitation").executeUpdate();
        entityManager.createQuery("DELETE FROM Media").executeUpdate();
    }

    // Created inside each test's own transaction so the entities stay managed.
    private void createUsers() {
        if (host != null) {
            return;
        }
        host = user("host");
        invitee = user("invitee");
        attendee = user("attendee");
        stranger = user("stranger");

        location = new Location();
        location.setAddress("Test Address");
        location.setLatitude(48.2082);
        location.setLongitude(16.3738);
        entityManager.persist(location);
        entityManager.flush();
    }

    private User user(String name) {
        User user = new User();
        user.setDisplayName(name);
        user.setDistinctName(name);
        user.setEmail(name + "@example.com");
        entityManager.persist(user);
        return user;
    }

    private Party party(String visibility) {
        createUsers();
        Party party = new Party();
        party.setTitle(visibility + " party");
        party.setHost_user(host);
        party.setLocation(location);
        party.setVisibility(visibility);
        party.setUsers(new HashSet<>(Set.of(attendee)));
        entityManager.persist(party);

        Invitation invitation = new Invitation();
        invitation.setParty(party);
        invitation.setSender(host);
        invitation.setRecipient(invitee);
        invitation.setStatus("PENDING");
        entityManager.persist(invitation);
        entityManager.flush();
        return party;
    }

    private Media media(Party party, User uploader, String file) {
        Media media = new Media(party, uploader, file);
        entityManager.persist(media);
        entityManager.flush();
        return media;
    }

    @Test
    void testGetMediaByParty_empty() {
        assertTrue(mediaRepository.getMediaByParty(party("PUBLIC").getId(), null).isEmpty());
    }

    @Test
    void testGetMediaByParty_returnsIdentitiesWithoutStorageReference() {
        Party party = party("PUBLIC");
        Media media = media(party, host, "party1/secret-name.jpg");

        List<MediaDto> result = mediaRepository.getMediaByParty(party.getId(), null);

        assertEquals(List.of(new MediaDto(media.getId(), party.getId(), false)), result);
    }

    @Test
    void testFindVisibleMedia_publicPartyIsVisibleToAnonymous() {
        Media media = media(party("PUBLIC"), host, "x.jpg");
        assertTrue(mediaRepository.findVisibleMedia(media.getId(), null).isPresent());
    }

    @Test
    void testFindVisibleMedia_privatePartyViewerRoles() {
        Media media = media(party("PRIVATE"), host, "x.jpg");

        assertTrue(mediaRepository.findVisibleMedia(media.getId(), host.getId()).isPresent(), "host");
        assertTrue(mediaRepository.findVisibleMedia(media.getId(), invitee.getId()).isPresent(), "pending invitee");
        assertTrue(mediaRepository.findVisibleMedia(media.getId(), attendee.getId()).isPresent(), "joined attendee");
        assertTrue(mediaRepository.findVisibleMedia(media.getId(), stranger.getId()).isEmpty(), "unrelated user");
        assertTrue(mediaRepository.findVisibleMedia(media.getId(), null).isEmpty(), "anonymous");
    }

    @Test
    void testFindVisibleMedia_declinedInvitationIsNotAViewer() {
        Party party = party("PRIVATE");
        Invitation invitation = entityManager.createQuery(
                "SELECT i FROM Invitation i WHERE i.party = :party", Invitation.class)
                .setParameter("party", party).getSingleResult();
        invitation.setStatus("DECLINED");
        Media media = media(party, host, "x.jpg");

        assertTrue(mediaRepository.findVisibleMedia(media.getId(), invitee.getId()).isEmpty());
    }

    @Test
    void testFindVisibleMedia_missing() {
        createUsers();
        assertTrue(mediaRepository.findVisibleMedia(999_999L, host.getId()).isEmpty());
    }

    @Test
    void testGetVisibleMediaByUser_hidesPrivatePartyItemsFromOthers() {
        Media publicItem = media(party("PUBLIC"), attendee, "a.jpg");
        Media privateItem = media(party("PRIVATE"), attendee, "b.jpg");

        List<Long> forStranger = mediaRepository.getVisibleMediaByUser(attendee.getId(), stranger.getId())
                .stream().map(MediaDto::id).toList();
        List<Long> forAnonymous = mediaRepository.getVisibleMediaByUser(attendee.getId(), null)
                .stream().map(MediaDto::id).toList();
        List<Long> forHost = mediaRepository.getVisibleMediaByUser(attendee.getId(), host.getId())
                .stream().map(MediaDto::id).toList();

        assertEquals(List.of(publicItem.getId()), forStranger);
        assertEquals(List.of(publicItem.getId()), forAnonymous);
        assertEquals(List.of(publicItem.getId(), privateItem.getId()), forHost);
    }

    @Test
    void testResolveStoredImage_detectsTypeFromContent() throws IOException {
        Path dir = Files.createDirectories(Paths.get(uploadDir, "partyresolve"));
        Files.write(dir.resolve("image.jpg"), PNG_BYTES);
        Media media = media(party("PUBLIC"), host, "partyresolve/image.jpg");

        Optional<MediaRepository.StoredImage> image = mediaRepository.resolveStoredImage(media);

        assertTrue(image.isPresent());
        assertEquals(ImageType.PNG, image.get().type());
    }

    @Test
    void testResolveStoredImage_missingFile() {
        Media media = media(party("PUBLIC"), host, "partyresolve/does-not-exist.jpg");
        assertTrue(mediaRepository.resolveStoredImage(media).isEmpty());
    }

    @Test
    void testResolveStoredImage_rejectsPathOutsideUploadDir() throws IOException {
        Path outside = Files.createDirectories(Paths.get(uploadDir).toAbsolutePath().getParent().resolve("outside"));
        Files.write(outside.resolve("escape.png"), PNG_BYTES);
        Media media = media(party("PUBLIC"), host, "../outside/escape.png");

        assertTrue(mediaRepository.resolveStoredImage(media).isEmpty());
    }

    @Test
    void testImageTypeDetection() throws IOException {
        Path dir = Files.createDirectories(Paths.get(uploadDir, "sniff"));
        assertEquals(Optional.of(ImageType.JPEG), detect(dir, "a", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0}));
        assertEquals(Optional.of(ImageType.PNG), detect(dir, "b", PNG_BYTES));
        assertEquals(Optional.of(ImageType.GIF), detect(dir, "c", "GIF89a".getBytes()));
        assertEquals(Optional.of(ImageType.WEBP), detect(dir, "d", "RIFF\0\0\0\0WEBPVP8 ".getBytes()));
        assertEquals(Optional.empty(), detect(dir, "e", "<html>hello</html>".getBytes()));
        assertEquals(Optional.empty(), detect(dir, "f", new byte[0]));
    }

    private Optional<ImageType> detect(Path dir, String name, byte[] content) throws IOException {
        Path file = dir.resolve(name);
        Files.write(file, content);
        return ImageType.detect(file);
    }
}
