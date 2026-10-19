package at.htl.favorite;

import at.htl.auth.CurrentUserResolver;
import at.htl.party.Party;
import at.htl.party.PartyRepository;
import io.quarkus.security.Authenticated;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
@Path("/api/favorites")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
public class FavoritesResource {
    @Inject EntityManager em;
    @Inject CurrentUserResolver currentUser;
    @Inject PartyRepository parties;

    @GET
    @Transactional
    public Response list() {
        Long userId = currentUser.requireCurrentUserId();
        var saved = em.createQuery("select f.party from Favorite f where f.user.id = :userId order by f.id desc", Party.class)
                .setParameter("userId", userId).getResultList();
        // A favorite must never grant access after an invitation is revoked.
        return Response.ok(saved.stream()
                .filter(p -> parties.getPartyByIdIfVisible(p.getId(), userId) != null).toList()).build();
    }
}
