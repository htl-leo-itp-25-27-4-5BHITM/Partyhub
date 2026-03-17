package at.htl.repository;

import at.htl.category.Category;
import at.htl.category.CategoryRepository;
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
public class CategoryRepositoryTest {

    @Inject
    CategoryRepository categoryRepository;

    @Inject
    EntityManager entityManager;

    @BeforeEach
    void setUp() {
        // Clean up in proper order due to foreign key constraints
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

    @Test
    void testGetCategory_empty() {
        List<Category> categories = categoryRepository.getCategory();
        assertNotNull(categories);
        assertTrue(categories.isEmpty());
    }

    @Test
    void testGetCategory_afterCreate() {
        Category category = new Category();
        category.setName("Test Category");
        entityManager.persist(category);
        entityManager.flush();

        List<Category> categories = categoryRepository.getCategory();
        assertEquals(1, categories.size());
        assertEquals("Test Category", categories.get(0).getName());
    }

    @Test
    void testGetCategoryById() {
        Category category = new Category();
        category.setName("Test Category");
        entityManager.persist(category);
        entityManager.flush();

        Category found = categoryRepository.getCategoryById(category.getId());
        assertNotNull(found);
        assertEquals("Test Category", found.getName());
    }

    @Test
    void testGetCategoryById_notFound() {
        Category found = categoryRepository.getCategoryById(999L);
        assertNull(found);
    }
}
