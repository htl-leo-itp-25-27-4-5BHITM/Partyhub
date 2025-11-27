package at.htl.repository;

import at.htl.model.User;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.resteasy.reactive.NoCache;

import java.util.List;

@ApplicationScoped
public class UserRepository {
    @Inject
    EntityManager em;

    @Inject
    SecurityIdentity identity;
    @Inject
    JsonWebToken jwt;

    public UserRepository() {

    }

    public List<User> getUsers() {
        return em.createQuery("SELECT u FROM User u", User.class).getResultList();
    }

    public User getUser(long id) {
        return em.find(User.class, id);
    }

}
