package at.htl.block;

import at.htl.auth.CurrentUserResolver;
import at.htl.user.ProfileDto;
import at.htl.user.User;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.Map;

/** The caller's own blocks. Nobody can read or change another user's block list. */
@Path("/api/me/blocks")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
public class BlockResource {

    @Inject
    BlockRepository blockRepository;

    @Inject
    CurrentUserResolver currentUserResolver;

    @Inject
    EntityManager em;

    @GET
    public List<ProfileDto> list() {
        return blockRepository.blockedBy(currentUserResolver.requireCurrentUserId()).stream()
                .map(user -> ProfileDto.from(user, false))
                .toList();
    }

    @PUT
    @Path("/{userId}")
    @Transactional
    public Response block(@PathParam("userId") long userId) {
        long callerId = currentUserResolver.requireCurrentUserId();
        if (callerId == userId) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("message", "You cannot block yourself")).build();
        }
        if (em.find(User.class, userId) == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        blockRepository.block(callerId, userId);
        return Response.noContent().build();
    }

    @DELETE
    @Path("/{userId}")
    @Transactional
    public Response unblock(@PathParam("userId") long userId) {
        blockRepository.unblock(currentUserResolver.requireCurrentUserId(), userId);
        return Response.noContent().build();
    }
}
