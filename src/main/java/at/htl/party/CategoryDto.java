package at.htl.party;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class CategoryDto {
    private Long id;
    private String name;

    public CategoryDto() {}

    public CategoryDto(at.htl.category.Category category) {
        if (category != null) {
            this.id = category.getId();
            this.name = category.getName();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}