package at.htl.repository;

import at.htl.model.User;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

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

    public User save(User user) {
        if (user.getId() == null) {
            em.persist(user);
            return user;
        } else {
            return em.merge(user);
        }
    }

    public User createOrUpdateByEmail(String name, String email) {
        User user = findByEmail(email);
        if (user == null) {
            user = new User();
            user.setName(name);
            user.setEmail(email);
            // default profile image will be set by entity lifecycle
            save(user);
        } else {
            user.setName(name);
            save(user);
        }
        return user;
    }

}
