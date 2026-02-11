package at.htl.auth;

import at.htl.user.User;
import at.htl.user.UserContext;
import at.htl.user.UserCreateDto;
import at.htl.user.UserRepository;
import io.quarkus.security.Authenticated;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.logging.Logger;

import java.util.Map;

@ApplicationScoped
@Path("/api/auth")
public class AuthResource {

    @Inject
    UserContext userContext;

    @Inject
    UserRepository userRepository;

    @Inject
    JsonWebToken jwt;

    @Inject
    Logger logger;

    @GET
    @Path("/status")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAuthStatus() {
        User user = userContext.getCurrentUser();
        String email = userContext.getCurrentUserEmail();
        String name = userContext.getCurrentUserName();

        if (user != null) {
            return Response.ok(Map.of(
                    "authenticated", true,
                    "linked", true,
                    "user", user
            )).build();
        } else if (email != null) {
            return Response.ok(Map.of(
                    "authenticated", true,
                    "linked", false,
                    "email", email,
                    "name", name != null ? name : "",
                    "message", "Keycloak authenticated but no PartyHub account linked"
            )).build();
        } else {
            return Response.ok(Map.of(
                    "authenticated", false,
                    "linked", false,
                    "message", "Not authenticated"
            )).build();
        }
    }

    @POST
    @Path("/link-account")
    @Authenticated
    @Transactional
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response linkAccount(UserCreateDto userCreateDto) {
        String email = userContext.getCurrentUserEmail();
        String name = userContext.getCurrentUserName();

        if (email == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "No email found in JWT token"))
                    .build();
        }

        User existingUser = userRepository.findByEmail(email);
        if (existingUser != null) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(Map.of("error", "Account already linked", "user", existingUser))
                    .build();
        }

        User newUser = new User();
        newUser.setEmail(email);
        newUser.setDisplayName(userCreateDto.displayName() != null ? userCreateDto.displayName() : name);
        newUser.setDistinctName(userCreateDto.distinctName() != null ? userCreateDto.distinctName() : generateDistinctName(name));
        newUser.setBiography(userCreateDto.biography());
        newUser.setProfileImage(userCreateDto.profilePicture());

        Response response = userRepository.createUser(newUser);
        if (response.getStatus() == Response.Status.CREATED.getStatusCode() || 
            response.getStatus() == Response.Status.OK.getStatusCode()) {
            logger.info("Created new user linked to Keycloak account: " + email);
            return Response.ok(Map.of(
                    "message", "Account linked successfully",
                    "user", newUser
            )).build();
        }

        return response;
    }

    @POST
    @Path("/link-existing/{userId}")
    @Authenticated
    @Transactional
    @Produces(MediaType.APPLICATION_JSON)
    public Response linkExistingAccount(@PathParam("userId") Long userId) {
        String email = userContext.getCurrentUserEmail();

        if (email == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "No email found in JWT token"))
                    .build();
        }

        User user = userRepository.getUser(userId);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "User not found"))
                    .build();
        }

        if (user.getEmail() != null && !user.getEmail().equals(email)) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(Map.of("error", "User already has a different email"))
                    .build();
        }

        user.setEmail(email);
        userRepository.updateUser(userId, new UserCreateDto(
                user.getDisplayName(),
                user.getDistinctName(),
                email,
                user.getBiography(),
                user.getProfileImage()
        ));

        logger.info("Linked existing user " + userId + " to Keycloak account: " + email);
        return Response.ok(Map.of(
                "message", "Account linked successfully",
                "user", user
        )).build();
    }

    private String generateDistinctName(String name) {
        if (name == null) {
            name = "user";
        }
        String base = name.toLowerCase().replaceAll("[^a-z0-9]", "");
        return base + System.currentTimeMillis();
    }
}
