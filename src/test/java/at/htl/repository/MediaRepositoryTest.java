package at.htl.repository;

import at.htl.location.Location;
import at.htl.media.Media;
import at.htl.media.MediaDto;
import at.htl.media.MediaRepository;
import at.htl.party.Party;
import at.htl.user.User;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
@Transactional
public class MediaRepositoryTest {

    @Inject
    MediaRepository mediaRepository;

    @Inject
    EntityManager entityManager;

    @BeforeEach
    void setUp() {
        entityManager.createQuery("DELETE FROM Notification").executeUpdate();
        entityManager.createQuery("DELETE FROM Media").executeUpdate();
        entityManager.createQuery("DELETE FROM Party").executeUpdate();
        entityManager.createQuery("DELETE FROM UserNotificationSettings").executeUpdate();
        entityManager.createQuery("DELETE FROM User").executeUpdate();
        entityManager.flush();
    }

    private Party createTestParty() {
        User user = new User();
        user.setDisplayName("Test User");
        user.setDistinctName("testuser");
        user.setEmail("test@example.com");
        entityManager.persist(user);

        Location location = new Location();
        location.setAddress("Test Address");
        location.setLatitude(48.2082);
        location.setLongitude(16.3738);
        entityManager.persist(location);

        Party party = new Party();
        party.setTitle("Test Party");
        party.setHost_user(user);
        party.setLocation(location);
        entityManager.persist(party);
        entityManager.flush();
        return party;
    }

    @Test
    void testGetImages_empty() {
        Party party = createTestParty();
        List<MediaDto> images = mediaRepository.getImages(party.getId());
        assertNotNull(images);
        assertTrue(images.isEmpty());
    }

    @Test
    void testGetMediaByUser_empty() {
        List<MediaDto> media = mediaRepository.getMediaByUser(1L);
        assertNotNull(media);
        assertTrue(media.isEmpty());
    }

    @Test
    void testGetMediaByParty_empty() {
        List<MediaDto> media = mediaRepository.getMediaByParty(1L);
        assertNotNull(media);
        assertTrue(media.isEmpty());
    }

    @Test
    void testGetMediaByUser_withData() {
        Party party = createTestParty();
        User user = entityManager.createQuery("SELECT u FROM User u", User.class).getSingleResult();

        Media media = new Media(party, user, "test.jpg");
        entityManager.persist(media);
        entityManager.flush();

        List<MediaDto> result = mediaRepository.getMediaByUser(user.getId());
        assertEquals(1, result.size());
        assertEquals("test.jpg", result.get(0).url());
    }

    @Test
    void testGetMediaByParty_withData() {
        Party party = createTestParty();
        User user = entityManager.createQuery("SELECT u FROM User u", User.class).getSingleResult();

        Media media = new Media(party, user, "party.jpg");
        entityManager.persist(media);
        entityManager.flush();

        List<MediaDto> result = mediaRepository.getMediaByParty(party.getId());
        assertEquals(1, result.size());
        assertEquals("party.jpg", result.get(0).url());
    }

    @Test
    void testGetMediaById_notFound() {
        var response = mediaRepository.getMediaById(999L);
        assertEquals(404, response.getStatus());
    }

    @Test
    void testGetImgByMediaId_notFound() {
        var response = mediaRepository.getImgByMediaId(999L);
        assertEquals(404, response.getStatus());
    }
}
