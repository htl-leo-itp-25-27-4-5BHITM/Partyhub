package at.htl.party;

import at.htl.category.CategoryRepository;
import at.htl.FilterDto;
import at.htl.location.Location;
import at.htl.location.LocationRepository;
import at.htl.user.User;
import at.htl.user.UserContext;
import at.htl.user.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceException;
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

    @Inject
    LocationRepository locationRepository;
    @Inject
    CategoryRepository categoryRepository;
    @Inject
    UserRepository userRepository;
    @Inject
    UserContext userContext;

    private static final DateTimeFormatter PARTY_DTF = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    public List<Party> getParties() {
        List<Party> result;
        result = entityManager.createQuery("SELECT u FROM Party u", Party.class).getResultList();
        return result;
    }

    public Response addParty(PartyCreateDto partyCreateDto) {
        Party party = partyCreateDtoToParty(partyCreateDto);
        party.setHost_user(userContext.getCurrentUser());
        entityManager.persist(party);
        return Response.created(UriBuilder.fromMethod(PartyResource.class, "addParty").build()).build();
    }

    public Response removeParty( Long id) {
        Party party = entityManager.find(Party.class, id);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        Long matches = entityManager.createQuery(
                        "SELECT COUNT(p) FROM Party p WHERE p.id = :id AND p.host_user.id = :hostId",
                        Long.class)
                .setParameter("id", id)
                .setParameter("hostId", userContext.getCurrentUserId())
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
        updatedParty.setHost_user(userContext.getCurrentUser());

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
            logger.log(Logger.Level.ERROR, e.getMessage());
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
        Party party = entityManager.find(Party.class, id);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        User user = userContext.getCurrentUser();
        if (user == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity("User not found").build();
        }
        if (party.getUsers().contains(user)) {
            return Response.status(Response.Status.CONFLICT).entity("User is also Host-User").build();
        }
        try {
            party.getUsers().add(user);
            entityManager.merge(party);
            return Response.noContent().build();
        } catch (PersistenceException e) {
            logger.error("Error while attending party: " + e.getMessage());
            return Response.noContent().build();
        }
    }

    public Response leaveParty(Long id){
        Party party = entityManager.find(Party.class, id);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        User user = userContext.getCurrentUser();
        if (user == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity("User not found").build();
        }

        if (party.getUsers() == null || !party.getUsers().contains(user)) {
            return Response.status(404).build();
        }

        party.getUsers().remove(user);
        entityManager.merge(party);
        return Response.ok().entity(party).build();
    }

    public Response attendStatus(Long id){
        Party party = entityManager.find(Party.class, id);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        boolean attending = false;
        int count = 0;
        if (party.getUsers() != null) {
            count = party.getUsers().size();
            User user = userContext.getCurrentUser();
            if (user != null) {
                attending = party.getUsers().contains(user);
            }
        }
        java.util.Map<String, Object> result = java.util.Map.of("attending", attending, "count", count);
        return Response.ok(result).build();
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
                    "Invalid date‑time format", e);
        }
        party.setWebsite(partyCreateDto.website());

        Location location = locationRepository.findByLatitudeAndLongitude(partyCreateDto.latitude(), partyCreateDto.longitude());
        if (location != null) {
            party.setLocation(location);
        }else {
            Location newLocation = new Location();
            newLocation.setLatitude(partyCreateDto.latitude());
            newLocation.setLongitude(partyCreateDto.longitude());
            newLocation.setAddress(partyCreateDto.location_address());
            entityManager.persist(newLocation);
            party.setLocation(newLocation);
        }

        party.setMax_age(partyCreateDto.max_age());
        party.setMin_age(partyCreateDto.min_age());
        if (partyCreateDto.category_id() != null) {
            party.setCategory(categoryRepository.getCategoryById(partyCreateDto.category_id()));
        } else {
            party.setCategory(categoryRepository.getCategoryById(1L));
        }

        party.setCreated_at(LocalDateTime.now());
        return party;
    }
}