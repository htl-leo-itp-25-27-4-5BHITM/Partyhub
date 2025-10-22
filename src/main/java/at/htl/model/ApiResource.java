package at.htl.model;

import at.htl.entity.Category;
import at.htl.entity.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ApiResource {
    @PersistenceContext
    EntityManager entityManager;

    @GET
    @Path("/users")
    public List<User> getUsers() {
        return entityManager.createQuery("SELECT u FROM User u", User.class).getResultList();
    }
    @GET
    @Path("/categories")
    public List<Category> getCategory() {
        return entityManager.createQuery("SELECT c FROM Category c", Category.class).getResultList();
    }
}
