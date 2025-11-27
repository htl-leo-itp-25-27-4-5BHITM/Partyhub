package at.htl.repository;

import at.htl.model.Category;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.util.List;

@ApplicationScoped
public class GenericRepository {

    @Inject
    EntityManager entityManager;

    public Category getCategoryById(Long category_id) {
        return entityManager.find(Category.class, category_id);
    }

    public List<Category> getCategory() {
        return entityManager.createQuery("SELECT c FROM Category c", Category.class).getResultList();
    }
}
