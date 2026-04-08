package at.htl.party;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

import at.htl.FilterDto;
import at.htl.category.Category;
import at.htl.category.CategoryRepository;
import at.htl.location.Location;
import at.htl.location.LocationRepository;
import at.htl.user.User;
import at.htl.invitation.Invitation;
import at.htl.notification.Notification;
import at.htl.notification.NotificationRepository;
import at.htl.follow.FollowRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriBuilder;

@ApplicationScoped
@Transactional
public class PartyRepository {

    @Inject
    EntityManager entityManager;

    //@Inject
    //Logger logger;

    @Inject
    LocationRepository locationRepository;

    @Inject
    CategoryRepository categoryRepository;

    @Inject
    NotificationRepository notificationRepository;

    @Inject
    FollowRepository followRepository;

    //@Inject
    //UserRepository userRepository;

    private static final DateTimeFormatter PARTY_DTF = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    public List<Party> getParties() {
        return entityManager.createQuery("SELECT p FROM Party p", Party.class).getResultList();
    }

    public List<Party> getPartiesByUser(Long userId) {
        if (userId == null) {
            // If no user ID provided, only return PUBLIC parties
            return entityManager.createQuery(
                    "SELECT DISTINCT p FROM Party p WHERE p.visibility = 'PUBLIC' ORDER BY p.time_start DESC",
                    Party.class)
                    .getResultList();
        }

        User user = entityManager.find(User.class, userId);
        if (user == null) {
            return entityManager.createQuery(
                    "SELECT DISTINCT p FROM Party p WHERE p.visibility = 'PUBLIC' ORDER BY p.time_start DESC",
                    Party.class)
                    .getResultList();
        }

        // Return:
        // 1. All PUBLIC parties
        // 2. PRIVATE parties where user is host
        // 3. PRIVATE parties where user is invited (has invitation)
        // 4. PRIVATE parties where user is attendee
        return entityManager.createQuery(
                "SELECT DISTINCT p FROM Party p " +
                "LEFT JOIN p.invitations i " +
                "LEFT JOIN p.users pu " +
                "WHERE p.visibility = 'PUBLIC' " +
                "OR p.host_user.id = :userId " +
                "OR i.recipient.id = :userId " +
                "OR pu.id = :userId " +
                "ORDER BY p.time_start DESC",
                Party.class)
                .setParameter("userId", userId)
                .getResultList();
    }

    public Response addParty(PartyCreateDto partyCreateDto, Long userId) {
        if (userId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"User ID required\"}")
                    .build();
        }

        User host = entityManager.find(User.class, userId);
        if (host == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"User not found\"}")
                    .build();
        }

        Party party = partyCreateDtoToParty(partyCreateDto);
        party.setHost_user(host);

        // Set visibility
        String visibility = partyCreateDto.visibility() != null ? partyCreateDto.visibility() : "PUBLIC";
        party.setVisibility(visibility);

        entityManager.persist(party);

        // Handle invitations and notifications for PRIVATE parties
        if ("PRIVATE".equalsIgnoreCase(visibility) && partyCreateDto.selectedUsers() != null && !partyCreateDto.selectedUsers().isEmpty()) {
            for (String selectedHandle : partyCreateDto.selectedUsers()) {
                User recipient = entityManager.createQuery(
                        "SELECT u FROM User u WHERE u.distinctName = :distinctName",
                        User.class)
                        .setParameter("distinctName", selectedHandle)
                        .getResultList()
                        .stream()
                        .findFirst()
                        .orElse(null);

                if (recipient != null && !recipient.getId().equals(userId)) {
                    // Create invitation
                    Invitation invitation = new Invitation();
                    invitation.setSender(host);
                    invitation.setRecipient(recipient);
                    invitation.setParty(party);
                    entityManager.persist(invitation);

                    // Create notification
                    String message = host.getDisplayName() + " hat dich zu der Party \"" + party.getTitle() + "\" eingeladen";
                    Notification notification = new Notification(recipient, host, party, message);
                    notificationRepository.createNotification(notification);
                }
            }
        }

        return Response.created(
                UriBuilder.fromResource(PartyResource.class)
                        .path(String.valueOf(party.getId()))
                        .build()
        ).build();
    }

    public Response removeParty(Long id) {
        Party party = entityManager.find(Party.class, id);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        entityManager.remove(party);
        return Response.noContent().build();
    }

    public Response updateParty(Long id, PartyCreateDto partyCreateDto, Long userId) {
        if (userId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"User ID required\"}")
                    .build();
        }

        Party party = entityManager.find(Party.class, id);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        User host = entityManager.find(User.class, userId);
        if (host == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"User not found\"}")
                    .build();
        }

        Party updatedFields = partyCreateDtoToParty(partyCreateDto);
        updatedFields.setId(id);
        updatedFields.setHost_user(host);

        entityManager.merge(updatedFields);
        return Response.ok(updatedFields).build();
    }

    public Response filterParty(@QueryParam("filter") String filter, FilterDto req) {
        if (filter == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Query-Parameter 'filter' fehlt.")
                    .build();
        }
         List<Party> result = switch (filter.toLowerCase()) {
                case "content" -> findByTitleOrDescription(req.value());
                case "category" -> findByCategory(req.value());
                case "date" -> findByDateRange(req.start(), req.end());
                default -> null;
            };

            if (result == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity("Ungültiger Filter-Typ. Erlaubt sind: content, category, date.")
                        .build();
            }
            return Response.ok(result).build();
        }

    List<Party> findByTitleOrDescription(String param) {
        String like = "%" + param.trim().toLowerCase() + "%";
        String jpql = "SELECT p FROM Party p WHERE LOWER(p.title) LIKE :like OR LOWER(p.description) LIKE :like";
        return entityManager.createQuery(jpql, Party.class)
                .setParameter("like", like)
                .getResultList();
    }

    List<Party> findByCategory(String param) {
        String jpql = "SELECT p FROM Party p WHERE p.category.name = :param";
        return entityManager.createQuery(jpql, Party.class)
                .setParameter("param", param)
                .getResultList();
    }

    List<Party> findByDateRange(String startStr, String endStr) {
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

    public Party getPartyByIdIfVisible(Long party_id, Long userId) {
        Party party = entityManager.find(Party.class, party_id);
        if (party == null) {
            return null;
        }

        // Check if party is visible to this user
        if ("PUBLIC".equals(party.getVisibility())) {
            return party;
        }

        // For PRIVATE parties, check if user is authorized
        if (userId != null) {
            // User is the host
            if (party.getHost_user().getId().equals(userId)) {
                return party;
            }

            // User is invited (has invitation)
            boolean hasInvitation = party.getInvitations() != null && 
                    party.getInvitations().stream().anyMatch(i -> i.getRecipient().getId().equals(userId));
            if (hasInvitation) {
                return party;
            }

            // User is attendee
            if (party.getUsers() != null && party.getUsers().stream().anyMatch(u -> u.getId().equals(userId))) {
                return party;
            }
        }

        return null; // Not authorized to view this private party
    }

    public Response attendParty(Long partyId, Long userId) {
        if (userId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"User ID required\"}")
                    .build();
        }

        Party party = entityManager.find(Party.class, partyId);
        User user = entityManager.find(User.class, userId);

        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Party not found\"}")
                    .build();
        }
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"User not found\"}")
                    .build();
        }

        if (!party.getUsers().contains(user)) {
            party.getUsers().add(user);
        }

        return Response.noContent().build();
    }

    public Response leaveParty(Long partyId, Long userId) {
        if (userId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"User ID required\"}")
                    .build();
        }

        Party party = entityManager.find(Party.class, partyId);
        User user = entityManager.find(User.class, userId);

        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Party not found\"}")
                    .build();
        }
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"User not found\"}")
                    .build();
        }

        if (party.getUsers().contains(user)) {
            party.getUsers().remove(user);
            entityManager.merge(party);
            return Response.ok(party).build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    public Response attendStatus(Long partyId, Long userId) {
        if (userId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"User ID required\"}")
                    .build();
        }

        Party party = entityManager.find(Party.class, partyId);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Party not found\"}")
                    .build();
        }

        User user = entityManager.find(User.class, userId);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"User not found\"}")
                    .build();
        }

        boolean attending = party.getUsers() != null && party.getUsers().contains(user);
        int count = party.getUsers() != null ? party.getUsers().size() : 0;

        return Response.ok(Map.of("attending", attending, "count", count)).build();
    }

    private LocalDateTime parseDateTime(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            if (dateStr.contains("T")) {
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

        Long catId = (dto.category_id() != null && dto.category_id() != 0) ? dto.category_id() : 1L;
        Category category = categoryRepository.getCategoryById(catId);

        if (category == null) {
            throw new BadRequestException("Kategorie mit ID " + catId + " existiert nicht im System.");
        }
        party.setCategory(category);
        party.setVisibility(dto.visibility() != null ? dto.visibility() : "PUBLIC");

        party.setCreated_at(LocalDateTime.now());
        return party;
    }
}
