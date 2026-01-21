package at.htl.category;

import jakarta.persistence.*;

@Entity
@TableGenerator(name = "category")
@Table(name = "category")
public class Category{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    String name;

    public Category(){}

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
