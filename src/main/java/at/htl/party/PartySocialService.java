package at.htl.party;

import at.htl.user.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.*;

@ApplicationScoped
public class PartySocialService {
    public record Person(Long id, String name, String handle) {
        static Person from(User user) {
            if (user == null) return null;
            String name = user.getDisplayName();
            if (name == null || name.isBlank()) name = user.getDistinctName();
            if (name == null || name.isBlank()) name = "PartyHub member";
            return new Person(user.getId(), name, user.getDistinctName());
        }
    }
    public record Summary(Person host, int friendCount, List<Person> friends) {}

    @Inject EntityManager em;

    /** Call only with parties already filtered for the current viewer. */
    public void enrichVisibleParties(List<Party> parties, Long viewerId, boolean fullDetails) {
        if (parties.isEmpty()) return;
        Map<Long, List<Person>> friendsByParty = new HashMap<>();
        if (viewerId != null) {
            List<Long> ids = parties.stream().map(Party::getId).toList();
            List<Object[]> rows = em.createQuery(
                "SELECT p.id, u FROM Party p JOIN p.users u WHERE p.id IN :ids " +
                "AND u.id <> :viewer AND EXISTS (SELECT f FROM Follow f " +
                "WHERE f.user1_id = :viewer AND f.user2_id = u.id AND f.status.status_id = 2) " +
                "AND EXISTS (SELECT r FROM Follow r WHERE r.user1_id = u.id " +
                "AND r.user2_id = :viewer AND r.status.status_id = 2) " +
                "ORDER BY u.displayName, u.id", Object[].class)
                .setParameter("ids", ids).setParameter("viewer", viewerId).getResultList();
            for (Object[] row : rows) {
                friendsByParty.computeIfAbsent((Long) row[0], key -> new ArrayList<>())
                    .add(Person.from((User) row[1]));
            }
        }
        for (Party party : parties) {
            List<Person> friends = friendsByParty.getOrDefault(party.getId(), List.of());
            List<Person> shown = friends.stream().limit(fullDetails ? Long.MAX_VALUE : 3).toList();
            party.setDiscoverySocial(new Summary(Person.from(party.getHost_user()), friends.size(), shown));
        }
    }
}
