package at.htl.entity;

import jakarta.inject.Inject;
import jakarta.persistence.*;

@Entity
@TableGenerator(name = "category")
@Table(name = "category")
public class Category{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    String name;

    public Category(){
        this.id = null;
        this.name = null;
    }

    public static Category getCategoryById(Long category_id, EntityManager entityManager) {
        return entityManager.find(Category.class, category_id);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
