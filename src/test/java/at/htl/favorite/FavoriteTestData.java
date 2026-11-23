package at.htl.favorite;

import at.htl.party.Party;
import at.htl.user.User;
import jakarta.persistence.EntityManager;

/** Creates favorites in tests; the entity has no public setters. */
public final class FavoriteTestData {
    private FavoriteTestData() {
    }

    public static void create(EntityManager em, User user, Party party) {
        Favorite favorite = new Favorite();
        favorite.user = user;
        favorite.party = party;
        em.persist(favorite);
    }
}
