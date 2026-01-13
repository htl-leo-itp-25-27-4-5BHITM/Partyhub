package at.htl.repository;

import at.htl.dto.UserCreateDto;
import at.htl.model.Party;
import at.htl.model.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.core.Response;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class UserRepository {
    @Inject
    EntityManager em;

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
        return Response.ok(user).build();
    }

    @Transactional
    public Response updateUser(Long id, UserCreateDto createUserDto) {
        User user = getUser(id);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        user.setDisplayName(createUserDto.displayName());
        user.setDistinctName(createUserDto.distinctName());
        user.setEmail(createUserDto.email());
        user.setBiography(createUserDto.biography());
        user.setProfileImage(createUserDto.profilePicture());
        em.merge(user);
        return Response.ok(user).build();
    }
}
