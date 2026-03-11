package at.htl.user;

import java.util.List;

import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class UserRepository {
    @Inject
    EntityManager em;
    @Inject
    Logger logger;

    public UserRepository() {

    }

    public List<User> getUsers() {
        return em.createQuery("SELECT u FROM User u", User.class).getResultList();
    }

    public List<User> getUsersByDistinctNameSearch(String search) {
        String like = "%" + search + "%";
        String jpql =
        """
        SELECT u FROM User u WHERE u.distinctName like :substring
        """;
        return em.createQuery(jpql, User.class).setParameter("substring", like).getResultList();
    }

    public User getUser(long id) {
        return em.find(User.class, id);
    }

    public User findByEmail(String email) {
        List<User> res = em.createQuery("SELECT u FROM User u WHERE u.email = :email", User.class)
                .setParameter("email", email)
                .setMaxResults(1)
                .getResultList();
        return res.isEmpty() ? null : res.get(0);
    }

    public User findByDistinctName(String distinctName) {
        User res = em.createQuery("SELECT u FROM User u WHERE u.distinctName = :distinctName", User.class)
                .setParameter("distinctName", distinctName)
                .getSingleResultOrNull();
        return res;
    }

    public Response createUser(User user) {
        em.persist(user);
        return Response.status(Response.Status.CREATED).entity(user).build();
    }

    public Response updateUser(Long id, UserCreateDto createUserDto) {
        logger.info("UserRepository.updateUser called with id: " + id);
        User user = getUser(id);
        if (user == null) {
            logger.warn("User not found: " + id);
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        user.setDisplayName(createUserDto.displayName());
        user.setDistinctName(createUserDto.distinctName());
        user.setEmail(createUserDto.email());
        user.setBiography(createUserDto.biography());
        User merged = em.merge(user);
        return Response.ok(merged).build();
    }
}
