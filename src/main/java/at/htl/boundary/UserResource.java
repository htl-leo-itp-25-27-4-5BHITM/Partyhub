package at.htl.boundary;

import at.htl.model.User;
import at.htl.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Response;

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

    @GET
    @Path("/{id}")
    public Response getUser(@PathParam("id") long id) {
        User user = userRepository.getUser(id);
        return Response.ok(user).build();
    }
}
