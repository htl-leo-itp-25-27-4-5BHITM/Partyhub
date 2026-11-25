package at.htl.settings;

import at.htl.auth.CurrentUserResolver;
import at.htl.follow.FollowRepository;
import at.htl.user.User;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

/** Private/public switch of the caller's own account. */
@Path("/api/me/privacy")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
public class PrivacyResource {

    @Inject
    CurrentUserResolver currentUserResolver;

    @Inject
    FollowRepository followRepository;

    @Inject
    EntityManager em;

    @GET
    public PrivacyStateDto get() {
        User user = currentUserResolver.requireCurrentUser();
        return new PrivacyStateDto(user.isPrivateAccount(), followRepository.getPendingFollowerRequests(user.getId()).size());
    }

    @PUT
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional
    public Response update(@Valid @NotNull(message = "Choose private or public") PrivacyDto dto) {
        User user = em.find(User.class, currentUserResolver.requireCurrentUserId());
        if (!dto.isPrivate() && user.isPrivateAccount()) {
            long pending = followRepository.getPendingFollowerRequests(user.getId()).size();
            if (pending > 0 && !Boolean.TRUE.equals(dto.acceptPendingRequests())) {
                return Response.status(Response.Status.CONFLICT).entity(Map.of(
                        "code", "CONFIRM_ACCEPT_REQUESTS",
                        "message", "Going public accepts all open follow requests",
                        "pendingRequests", pending)).build();
            }
            followRepository.acceptAllPendingRequests(user.getId());
        }
        // Switching to private keeps every accepted follower; only new follows become requests.
        user.setPrivateAccount(dto.isPrivate());
        return Response.ok(new PrivacyStateDto(user.isPrivateAccount(),
                followRepository.getPendingFollowerRequests(user.getId()).size())).build();
    }
}
