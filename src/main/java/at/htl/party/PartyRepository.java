package at.htl.party;

import at.htl.category.Category;
import at.htl.category.CategoryRepository;
import at.htl.FilterDto;
import at.htl.location.Location;
import at.htl.location.LocationRepository;
import at.htl.user.User;
import at.htl.user.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriBuilder;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@ApplicationScoped
@Transactional // Wichtig für DB-Schreiboperationen
public class PartyRepository {

    @Inject
    EntityManager entityManager;

    @Inject
    Logger logger;

    @Inject
    LocationRepository locationRepository;

    @Inject
    CategoryRepository categoryRepository;

    @Inject
    UserRepository userRepository;

    private static final DateTimeFormatter PARTY_DTF = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    public List<Party> getParties() {
        return entityManager.createQuery("SELECT p FROM Party p", Party.class).getResultList();
    }

    public Response addParty(PartyCreateDto partyCreateDto) {
        Party party = partyCreateDtoToParty(partyCreateDto);

        User host = getCurrentOrFirstUser();
        if (host != null) {
            party.setHost_user(host);
        } else {
            logger.warn("Kein User in der Datenbank gefunden - Party wird ohne Host erstellt.");
        }

        entityManager.persist(party);

        return Response.created(
                UriBuilder.fromResource(PartyResource.class)
                        .path(String.valueOf(party.getId()))
                        .build()
        ).build();
    }

    private User getCurrentOrFirstUser() {
        List<User> users = entityManager.createQuery("SELECT u FROM User u", User.class)
                .setMaxResults(1)
                .getResultList();
        return users.isEmpty() ? null : users.get(0);
    }

    public Response removeParty(Long id) {
        Party party = entityManager.find(Party.class, id);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        entityManager.remove(party);
        return Response.noContent().build();
    }

    public Response updateParty(Long id, PartyCreateDto partyCreateDto) {
        Party party = entityManager.find(Party.class, id);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        Party updatedFields = partyCreateDtoToParty(partyCreateDto);
        updatedFields.setId(id);

        User host = getCurrentOrFirstUser();
        updatedFields.setHost_user(host);

        entityManager.merge(updatedFields);
        return Response.ok(updatedFields).build();
    }

    public Response filterParty(String filter, FilterDto req) {
        List<Party> result = switch (filter.toLowerCase()) {
            case "content"  -> findByTitleOrDescription(req.value());
            case "category" -> findByCategory(req.value());
            case "date"     -> findByDateRange(req.start(), req.end());
            default         -> null;
        };

        if (result == null) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        return Response.ok(result).build();
    }

    private List<Party> findByTitleOrDescription(String param) {
        String like = "%" + param.trim().toLowerCase() + "%";
        String jpql = "SELECT p FROM Party p WHERE LOWER(p.title) LIKE :like OR LOWER(p.description) LIKE :like";
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
            throw new BadRequestException("Start and End dates are required");
        }
        LocalDateTime start = parseDateTime(startStr);
        LocalDateTime end = parseDateTime(endStr);

        String jpql = "SELECT p FROM Party p WHERE p.time_start BETWEEN :start AND :end";
        return entityManager.createQuery(jpql, Party.class)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();
    }

    public Response sortParty(String sort) {
        String query = sort.equalsIgnoreCase("asc") ?
                "SELECT p FROM Party p ORDER BY p.time_start ASC" :
                "SELECT p FROM Party p ORDER BY p.time_start DESC";
        return Response.ok(entityManager.createQuery(query, Party.class).getResultList()).build();
    }

    public Party getPartyById(Long party_id) {
        return entityManager.find(Party.class, party_id);
    }

    public Response attendParty(Long id) {
        Party party = entityManager.find(Party.class, id);
        User user = getCurrentOrFirstUser();
        if (party == null || user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        if (!party.getUsers().contains(user)) {
            party.getUsers().add(user);
            entityManager.merge(party);
        }
        return Response.noContent().build();
    }

    public Response leaveParty(Long id) {
        Party party = entityManager.find(Party.class, id);
        User user = getCurrentOrFirstUser();
        if (party != null && user != null && party.getUsers().contains(user)) {
            party.getUsers().remove(user);
            entityManager.merge(party);
            return Response.ok(party).build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    public Response attendStatus(Long id) {
        Party party = entityManager.find(Party.class, id);
        if (party == null) return Response.status(Response.Status.NOT_FOUND).build();

        User user = getCurrentOrFirstUser();
        boolean attending = user != null && party.getUsers() != null && party.getUsers().contains(user);
        int count = party.getUsers() != null ? party.getUsers().size() : 0;

        return Response.ok(Map.of("attending", attending, "count", count)).build();
    }

    private LocalDateTime parseDateTime(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            if (dateStr.contains("T")) {
                // Ersetzt eventuelle Leerzeichen durch T für ISO-Konformität
                return LocalDateTime.parse(dateStr.trim().replace(" ", "T"));
            }
            return LocalDateTime.parse(dateStr.trim(), PARTY_DTF);
        } catch (DateTimeParseException e) {
            throw new BadRequestException("Ungültiges Datumsformat: " + dateStr + ". Erwartet: yyyy-MM-ddTHH:mm:ss oder dd.MM.yyyy HH:mm");
        }
    }

    private Party partyCreateDtoToParty(PartyCreateDto dto) {
        Party party = new Party();
        party.setTitle(dto.title());
        party.setDescription(dto.description());
        party.setFee(dto.fee());
        party.setTime_start(dto.time_start());
        party.setTime_end(dto.time_end());
        party.setWebsite(dto.website());
        party.setMax_age(dto.max_age());
        party.setMin_age(dto.min_age());

        // Location Logik
        Location location = locationRepository.findByLatitudeAndLongitude(dto.latitude(), dto.longitude());
        if (location != null) {
            party.setLocation(location);
        } else {
            Location newLocation = new Location();
            newLocation.setLatitude(dto.latitude());
            newLocation.setLongitude(dto.longitude());
            newLocation.setAddress(dto.location_address());
            entityManager.persist(newLocation);
            party.setLocation(newLocation);
        }

        // Category Logik mit Fehlerbehandlung für 500er Error
        Long catId = (dto.category_id() != null && dto.category_id() != 0) ? dto.category_id() : 1L;
        Category category = categoryRepository.getCategoryById(catId);

        if (category == null) {
            throw new BadRequestException("Kategorie mit ID " + catId + " existiert nicht im System.");
        }
        party.setCategory(category);

        party.setCreated_at(LocalDateTime.now());
        return party;
    }
}