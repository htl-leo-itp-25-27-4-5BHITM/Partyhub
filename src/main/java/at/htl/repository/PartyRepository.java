package at.htl.repository;

import at.htl.dto.PartyCreateDto;
import at.htl.model.Party;
import at.htl.model.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@ApplicationScoped
public class PartyRepository {

    private static final org.slf4j.Logger log = LoggerFactory.getLogger(PartyRepository.class);
    @Inject
    EntityManager entityManager;

    @Inject
    Logger logger;

    @Inject
    CategoryRepository categoryRepository;

    @Inject
    UserRepository userRepository;

    public List<Party> getParties() {
        List<Party> result;
        result = entityManager.createQuery("SELECT u FROM Party u", Party.class).getResultList();
        logger.info(result.get(1));
        return result;
    }

    public Response addParty(PartyCreateDto partyCreateDto) {
        Party party = partyCreateDtoToParty(partyCreateDto);
        // TODO: Use current user
        party.setHost_user(userRepository.getUser(1L));
        party.setCategory(categoryRepository.getCategoryById(partyCreateDto.category_id()));
        entityManager.persist(party);
        return  Response.ok(party).build();
    }

    public Response removeParty( Long id) {
        logger.info("removeParty");
        Party party = entityManager.find(Party.class, id);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        Long hostId = 1L;   // TODO: replace with actual authenticated user id
        Long matches = entityManager.createQuery(
                        "SELECT COUNT(p) FROM Party p WHERE p.id = :id AND p.host_user.id = :hostId",
                        Long.class)
                .setParameter("id", id)
                .setParameter("hostId", hostId)
                .getSingleResult();

        logger.info(party);
        if (matches != null && matches > 0) {
            entityManager.remove(party);
            return Response.ok().build();
        }
        return Response.status(Response.Status.FORBIDDEN).build();
    }

    // TODO: Check permission before updating
    public Response updateParty(Long id, PartyCreateDto partyCreateDto) {
        Party party = entityManager.find(Party.class, id);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        Party updatedParty = partyCreateDtoToParty(partyCreateDto);
        updatedParty.setId(id);
        updatedParty.setHost_user(userRepository.getUser(1L));

        entityManager.merge(updatedParty);
        return Response.ok().entity(updatedParty).build();
    }

    public Response filterParty( String filterType,  String filterParam) {
        List<Party> result;
        logger.log(Logger.Level.INFO, filterType + " filter" + filterParam);

        if (filterType.equals("title")) {
            String query = "SELECT p FROM Party p WHERE LOWER(p.title) LIKE lower(:filterParam) OR lower(p.description) LIKE lower(:filterParam)";
            String likePattern = "%" + filterParam.trim() + "%";
            result = entityManager.createQuery(query, Party.class)
                    .setParameter("filterParam", likePattern)
                    .getResultList();
        } else if (filterType.equals("description")) {
            String query = "SELECT p FROM Party p WHERE p.category.id = :categoryId";
            result=  entityManager.createQuery(query, Party.class)
                    .setParameter("categoryId", Integer.parseInt(filterParam.trim()))
                    .getResultList();
        }

        else if (filterType.equals("date")) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss");
            LocalDateTime dateTime = LocalDateTime.parse(filterParam.trim(), formatter);
            String query = "SELECT p FROM Party p WHERE p.time_start = :filterParam";
            result = entityManager.createQuery(query, Party.class)
                    .setParameter("filterParam", dateTime)
                    .getResultList();
        }
        else {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        return Response.ok().entity(result).build();
    }

    public Response sortParty( String sort) {
        String query;
        if (sort.equals("asc")) {
            query = "SELECT p FROM Party p ORDER BY p.time_start ASC, p.time_end ASC";
        }
        else if (sort.equals("desc")) {
            query = "SELECT p FROM Party p ORDER BY p.time_start DESC, p.time_end DESC";
        }
        else{
            logger.log(Logger.Level.ERROR, "sort not supported");
            return null;
        }
        return Response.ok().entity( entityManager.createQuery(
                        query,
                        Party.class)
                .getResultList()).build();
    }

    public Party getPartyById(Long party_id) {
        return entityManager.find(Party.class, party_id);
    }

    public Response attendParty(Long id){
        // TODO: Use current user
        Party party = entityManager.find(Party.class, id);
        User user = userRepository.getUser(1L);
        party.getUsers().add(user);
        entityManager.persist(party);
        logger.info(party);
        return Response.ok().build();
    }

    private Party partyCreateDtoToParty(PartyCreateDto partyCreateDto) {
        Party party = new Party();
        party.setTitle(partyCreateDto.title());
        party.setDescription(partyCreateDto.description());
        party.setFee(partyCreateDto.fee());
        party.setTime_start(LocalDateTime.parse(partyCreateDto.time_start()));
        party.setTime_end(LocalDateTime.parse(partyCreateDto.time_end()));
        party.setWebsite(partyCreateDto.website());
        party.setLatitude(partyCreateDto.latitude());
        party.setLongitude(partyCreateDto.longitude());
        party.setMax_age(partyCreateDto.max_age());
        party.setMin_age(partyCreateDto.min_age());
        party.setCategory(categoryRepository.getCategoryById(partyCreateDto.category_id()));

        party.setCreated_at(LocalDateTime.now());
        return party;
    }
}