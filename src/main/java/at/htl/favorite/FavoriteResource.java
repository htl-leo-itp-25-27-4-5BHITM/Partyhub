package at.htl.favorite;

import at.htl.auth.CurrentUserResolver;
import at.htl.party.Party;
import at.htl.party.PartyRepository;
import at.htl.user.User;
import io.quarkus.security.Authenticated;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;

@ApplicationScoped
@Path("/api/parties/{id}/favorite")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
@Transactional
public class FavoriteResource {
    @Inject EntityManager em;
    @Inject CurrentUserResolver currentUser;
    @Inject PartyRepository parties;

    @GET
    public Response status(@PathParam("id") Long partyId) {
        Long userId = currentUser.requireCurrentUserId();
        if (parties.getPartyByIdIfVisible(partyId, userId) == null) return Response.status(404).build();
        return Response.ok(Map.of("favorite", isSaved(userId, partyId))).build();
    }

    @PUT
    public Response save(@PathParam("id") Long partyId) {
        Long userId = currentUser.requireCurrentUserId();
        Party party = parties.getPartyByIdIfVisible(partyId, userId);
        if (party == null) return Response.status(404).build();
        // Serialize saves for this user so repeated/concurrent requests stay idempotent.
        User user = em.find(User.class, userId, LockModeType.PESSIMISTIC_WRITE);
        if (!isSaved(userId, partyId)) {
            Favorite favorite = new Favorite();
            favorite.user = user;
            favorite.party = party;
            em.persist(favorite);
        }
        return Response.ok(Map.of("favorite", true)).build();
    }

    @DELETE
    public Response remove(@PathParam("id") Long partyId) {
        Long userId = currentUser.requireCurrentUserId();
        em.createQuery("delete from Favorite f where f.user.id = :userId and f.party.id = :partyId")
                .setParameter("userId", userId).setParameter("partyId", partyId).executeUpdate();
        return Response.noContent().build();
    }

    private boolean isSaved(Long userId, Long partyId) {
        return em.createQuery("select count(f) from Favorite f where f.user.id = :userId and f.party.id = :partyId", Long.class)
                .setParameter("userId", userId).setParameter("partyId", partyId).getSingleResult() > 0;
    }
}
