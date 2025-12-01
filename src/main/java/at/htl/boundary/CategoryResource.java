package at.htl.boundary;

import at.htl.model.Category;
import at.htl.repository.CategoryRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api")
@ApplicationScoped
public class CategoryResource {

    @Inject
    CategoryRepository categoryRepository;

    @GET
    @Path("/category")
    @Produces(MediaType.APPLICATION_JSON)
    public List<Category> getCategory() {
        return categoryRepository.getCategory();
    }

    @GET
    @Path("/category/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Category getCategoryById(@PathParam("id") Long category_id) {
        return categoryRepository.getCategoryById(category_id);
    }
}
