package at.htl.resource;

import at.htl.TestBase;
import at.htl.profile_picture.ProfilePicture;
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

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class ProfilePictureResourceTest extends TestBase {
    static final byte[] PNG = Base64.getDecoder().decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=");

    @Inject EntityManager em;
    @ConfigProperty(name = "partyhub.profile-picture.upload-dir") String uploadDir;
    Long userId;

    @BeforeEach
    void createUser() {
        QuarkusTransaction.requiringNew().run(() -> {
            User user = new User();
            user.setKeycloakId("picture-owner");
            user.setDistinctName("picture-owner");
            em.persist(user);
            userId = user.getId();
        });
    }

    @AfterEach
    void removeUserAndPicture() {
        QuarkusTransaction.requiringNew().run(() -> {
            User user = em.find(User.class, userId);
            if (user != null) em.remove(user);
        });
    }

    private String upload(byte[] content, String filename) {
        return given().multiPart("file", filename, content, "image/png")
            .when().post("/api/users/{id}/upload-profile-picture", userId)
            .then().statusCode(200).extract().path("filename");
    }

    private void assertPicture(byte[] expected) {
        byte[] actual = given().when().get("/api/users/{id}/profile-picture", userId)
            .then().statusCode(200).contentType("image/png").extract().asByteArray();
        assertArrayEquals(expected, actual);
    }

    @Test
    @TestSecurity(user = "picture-owner")
    void repeatedUploadUpdatesOneRecordAndServesNewContent() {
        String first = upload(PNG, "avatar.png");
        byte[] replacement = java.util.Arrays.copyOf(PNG, PNG.length + 1);
        String second = upload(replacement, "replacement.png");
        assertNotEquals(first, second);
        assertPicture(replacement);
        given().get("/api/users/{id}/profile-picture-filename", userId)
            .then().statusCode(200).body("filename", equalTo(second));
        QuarkusTransaction.requiringNew().run(() -> {
            assertEquals(1L, em.createQuery("SELECT count(p) FROM ProfilePicture p WHERE p.user.id = :id", Long.class)
                .setParameter("id", userId).getSingleResult());
            assertEquals(second, em.find(User.class, userId).getProfilePicture().getPicture_name());
        });
        assertFalse(Files.exists(Path.of(uploadDir, first)));
    }

    @Test
    @TestSecurity(user = "picture-owner")
    void invalidUploadPreservesExistingPicture() {
        upload(PNG, "avatar.png");
        given().multiPart("file", "fake.png", "<svg onload='alert(1)'/>".getBytes(), "image/png")
            .post("/api/users/{id}/upload-profile-picture", userId)
            .then().statusCode(400);
        assertPicture(PNG);
    }

    @Test
    @TestSecurity(user = "picture-owner")
    void missingFilePreservesExistingPicture() {
        upload(PNG, "avatar.png");
        given().multiPart("other", "value").post("/api/users/{id}/upload-profile-picture", userId)
            .then().statusCode(400);
        assertPicture(PNG);
    }

    @Test
    @TestSecurity(user = "picture-owner")
    void detectsContentInsteadOfTrustingFilename() {
        assertTrue(upload(PNG, "untrusted.svg").endsWith(".png"));
        assertPicture(PNG);
    }

    @Test
    @TestSecurity(user = "picture-owner")
    void emptyFilePreservesExistingPicture() {
        upload(PNG, "avatar.png");
        given().multiPart("file", "empty.png", new byte[0], "image/png")
            .post("/api/users/{id}/upload-profile-picture", userId)
            .then().statusCode(400);
        assertPicture(PNG);
    }

    @Test
    @TestSecurity(user = "picture-owner")
    void storageFailurePreservesDatabaseRecordAndExistingPicture() throws Exception {
        String original = upload(PNG, "avatar.png");
        Path directory = Path.of(uploadDir);
        Path backup = directory.resolveSibling("profile-upload-backup");
        Files.move(directory, backup);
        try {
            // A regular file at the configured directory forces a storage failure.
            Files.writeString(directory, "not a directory");
            given().multiPart("file", "replacement.png", PNG, "image/png")
                .post("/api/users/{id}/upload-profile-picture", userId)
                .then().statusCode(500).body("error", equalTo("Failed to store profile picture"));
            given().get("/api/users/{id}/profile-picture-filename", userId)
                .then().statusCode(200).body("filename", equalTo(original));
        } finally {
            Files.deleteIfExists(directory);
            Files.move(backup, directory);
        }
        assertPicture(PNG);
    }

    @Test
    @TestSecurity(user = "another-user")
    void cannotUploadForAnotherUser() {
        given().multiPart("file", "avatar.png", PNG, "image/png")
            .post("/api/users/{id}/upload-profile-picture", userId)
            .then().statusCode(403);
    }

    @Test
    void cannotUploadAnonymously() {
        given().multiPart("file", "avatar.png", PNG, "image/png")
            .post("/api/users/{id}/upload-profile-picture", userId)
            .then().statusCode(401);
    }

    @Test
    void storedPathCannotReadOutsideUploadDirectory() throws Exception {
        Path outside = Path.of(uploadDir).toAbsolutePath().getParent().resolve("outside.png");
        Files.createDirectories(outside.getParent());
        Files.write(outside, PNG);
        try {
            QuarkusTransaction.requiringNew().run(() -> {
                User user = em.find(User.class, userId);
                ProfilePicture picture = new ProfilePicture("../outside.png", user);
                em.persist(picture);
                user.setProfilePicture(picture);
            });
            given().get("/api/users/{id}/profile-picture", userId)
                .then().statusCode(200).contentType("image/svg+xml");
        } finally {
            Files.deleteIfExists(outside);
        }
    }
}
