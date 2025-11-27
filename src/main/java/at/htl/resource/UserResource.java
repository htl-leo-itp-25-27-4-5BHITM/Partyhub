package at.htl.resource;

import at.htl.model.User;
import at.htl.repository.UserRepository;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.resteasy.reactive.NoCache;

import java.util.List;

@ApplicationScoped
@Path("/api/users")
public class UserResource {
    @Inject
    UserRepository userRepository;

    @GET
    @Path("/")
    public Response getUsers() {
        List<User> users = userRepository.getUsers();
        return Response.ok(users).build();
    }

    @POST
    @Path("/{id}")
    public Response getUser(@PathParam("id") long id) {
        User user = userRepository.getUser(id);
        return Response.ok(user).build();
    }
}
