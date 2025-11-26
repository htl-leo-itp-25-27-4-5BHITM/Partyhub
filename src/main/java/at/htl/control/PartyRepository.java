package at.htl.control;

import at.htl.entity.Category;
import at.htl.entity.Party;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;

@ApplicationScoped
public class PartyRepository {

    @PersistenceContext
    EntityManager em;

    @Transactional
    public Party updateParty(Long partyId, Long categoryId, LocalDateTime timeStart, LocalDateTime timeEnd,
                             Integer maxPeople, Integer minAge, Integer maxAge,
                             String title, String description) {
        Party party = em.find(Party.class, partyId);
        if (party == null) {
            return null;
        }

        if (categoryId != null) {
            Category category = Category.getCategoryById(categoryId, em);
            party.setCategory(category);
        }
        if (timeStart != null) party.setTime_start(timeStart);
        if (timeEnd != null) party.setTime_end(timeEnd);
        if (maxPeople != null) party.setMax_people(maxPeople);
        if (minAge != null) party.setMax_age(minAge);
        if (maxAge != null) party.setMax_age(maxAge);
        if (title != null) party.setTitle(title);
        if (description != null) party.setDescription(description);

        em.merge(party);
        return party;
    }
}