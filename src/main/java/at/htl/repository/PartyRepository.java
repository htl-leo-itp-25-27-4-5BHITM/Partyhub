package at.htl.repository;

import at.htl.boundary.PartyResource;
import at.htl.dto.FilterDto;
import at.htl.dto.PartyCreateDto;
import at.htl.model.Location;
import at.htl.model.Party;
import at.htl.model.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriBuilder;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

@ApplicationScoped
public class PartyRepository {

    @Inject EntityManager entityManager;
    @Inject Logger logger;

    @Inject LocationRepository locationRepository;
    @Inject CategoryRepository categoryRepository;
    @Inject UserRepository userRepository;

    private static final DateTimeFormatter PARTY_DTF = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    public List<Party> getParties() {
        List<Party> result;
        result = entityManager.createQuery("SELECT u FROM Party u", Party.class).getResultList();
        return result;
    }

    public Response addParty(PartyCreateDto partyCreateDto) {
        Party party = partyCreateDtoToParty(partyCreateDto);
        // TODO: Use current user
        party.setHost_user(userRepository.getUser(1L));
        entityManager.persist(party);
        return Response.created(UriBuilder.fromMethod(PartyResource.class, "addParty").build()).build();
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
        if (matches != null && matches > 0) {
            entityManager.remove(party);
            return Response.status(204).entity(party).build();
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
        logger.info(updatedParty.getCategory().getName());

        entityManager.merge(updatedParty);
        return Response.ok().entity(updatedParty).build();
    }
    public Response filterParty(String filter, FilterDto req) {
        List<Party> result = switch (filter.toLowerCase()) {
            case "content"      -> findByTitleOrDescription(req.value());
            case "category" -> findByCategory(req.value());
            case "date"       ->findByDateRange(req.start(), req.end());
            default -> null;
        };

        if (result == null) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        return Response.ok(result).build();
    }

    private List<Party> findByTitleOrDescription(String param) {
        String like = "%" + param.trim().toLowerCase() + "%";
        String jpql =
        """
        SELECT p FROM Party p
        WHERE LOWER(p.title) LIKE :like
           OR LOWER(p.description) LIKE :like
        """;
        return entityManager.createQuery(jpql, Party.class)
                .setParameter("like", like)
                .getResultList();
    }

    private List<Party> findByCategory(String param) {
        String jpql = "SELECT p FROM Party p WHERE p.category.name = :param";
        return entityManager.createQuery(jpql, Party.class)
                .setParameter("param", param)
                .getResultList();
    }

    private List<Party> findByDateRange(String startStr, String endStr) {
        if (startStr == null || endStr == null) {
            throw new BadRequestException("Both 'start' and 'end' must be provided for DATE filter");
        }

        LocalDateTime start;
        LocalDateTime end;
        try {
            start = LocalDateTime.parse(startStr.trim(), PARTY_DTF);
            end   = LocalDateTime.parse(endStr.trim(), PARTY_DTF);
        } catch (DateTimeParseException e) {
            logger.info(e.getMessage());
            throw new BadRequestException("Invalid date format");
        }

        if (end.isBefore(start)) {
            throw new BadRequestException("'end' must be after 'start'");
        }

        String jpql = """
        SELECT p FROM Party p
        WHERE p.time_start BETWEEN :start AND :end
        """;

        return entityManager.createQuery(jpql, Party.class)
                .setParameter("start", start)
                .setParameter("end",   end)
                .getResultList();
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
        try {
            party.setTime_start(LocalDateTime.parse(partyCreateDto.time_start(), PARTY_DTF));
            party.setTime_end(LocalDateTime.parse(partyCreateDto.time_end(), PARTY_DTF));
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(
                    "Invalid date‑time format. Expected 'dd.MM.yyyy HH:mm'.", e);
        }
        party.setWebsite(partyCreateDto.website());

        Location location = locationRepository.findByLatitudeAndLongitude(partyCreateDto.latitude(), partyCreateDto.longitude());
        if (location != null) {
            party.setLocation(location);
        }else {
            Location newLocation = new Location();
            newLocation.setLatitude(partyCreateDto.latitude());
            newLocation.setLongitude(partyCreateDto.longitude());
            entityManager.persist(newLocation);
            party.setLocation(newLocation);
        }

        party.setMax_age(partyCreateDto.max_age());
        party.setMin_age(partyCreateDto.min_age());
        party.setCategory(categoryRepository.getCategoryById(partyCreateDto.category_id()));

        party.setCreated_at(LocalDateTime.now());
        return party;
    }
}