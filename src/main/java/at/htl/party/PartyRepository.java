package at.htl.party;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import at.htl.location.Location;
import at.htl.location.LocationRepository;
import at.htl.user.User;
import at.htl.invitation.Invitation;
import at.htl.notification.Notification;
import at.htl.notification.NotificationRepository;
import at.htl.notification.OutOfAppNotificationService;
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

    @Inject
    LocationRepository locationRepository;

    @Inject
    NotificationRepository notificationRepository;

    @Inject
    OutOfAppNotificationService outOfAppNotificationService;

    @Inject
    FollowRepository followRepository;

    private static final DateTimeFormatter PARTY_DTF = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    public List<Party> getParties() {
        return entityManager.createQuery("SELECT p FROM Party p", Party.class).getResultList();
    }

    public List<Party> getPartiesByUser(Long userId) {
        if (userId == null) {
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

        String visibility = normalizeVisibility(partyCreateDto.visibility());
        party.setVisibility(visibility);

        entityManager.persist(party);

        inviteSelectedUsersForPrivateParty(partyCreateDto, party, host, userId);

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
        notifyPartyDeleted(party);
        List<Notification> notifications = entityManager.createQuery(
                        "SELECT n FROM Notification n WHERE n.party.id = :partyId",
                        Notification.class)
                .setParameter("partyId", party.getId())
                .getResultList();
        notifications.forEach(entityManager::remove);
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

        String oldSignature = partyUpdateSignature(party);

        party.setTitle(partyCreateDto.title());
        party.setDescription(partyCreateDto.description());
        party.setFee(partyCreateDto.fee());
        party.setTime_start(partyCreateDto.time_start());
        party.setTime_end(partyCreateDto.time_end());
        party.setWebsite(partyCreateDto.website());
        party.setMax_age(partyCreateDto.max_age());
        party.setMin_age(partyCreateDto.min_age());
        party.setMax_people(partyCreateDto.max_people());
        String visibility = normalizeVisibility(partyCreateDto.visibility());
        party.setVisibility(visibility);
        party.setHost_user(host);

        Location location = locationRepository.findByLatitudeAndLongitude(
                partyCreateDto.latitude(), partyCreateDto.longitude());
        if (location != null) {
            party.setLocation(location);
        } else {
            Location newLocation = new Location();
            newLocation.setLatitude(partyCreateDto.latitude());
            newLocation.setLongitude(partyCreateDto.longitude());
            newLocation.setAddress(partyCreateDto.location_address());
            entityManager.persist(newLocation);
            party.setLocation(newLocation);
        }

        party.setTheme(partyCreateDto.theme());
        Set<Long> newlyInvitedUserIds = inviteSelectedUsersForPrivateParty(partyCreateDto, party, host, userId);

        if (!Objects.equals(oldSignature, partyUpdateSignature(party))) {
            notifyPartyUpdated(party, host, userId, newlyInvitedUserIds);
        }

        return Response.ok(party).build();
    }

    private Set<Long> inviteSelectedUsersForPrivateParty(
            PartyCreateDto partyCreateDto,
            Party party,
            User host,
            Long hostUserId) {
        Set<Long> notifiedRecipientIds = new HashSet<>();
        if (!"PRIVATE".equalsIgnoreCase(party.getVisibility()) ||
                partyCreateDto.selectedUsers() == null ||
                partyCreateDto.selectedUsers().isEmpty()) {
            return notifiedRecipientIds;
        }

        for (String selectedUser : partyCreateDto.selectedUsers()) {
            User recipient = findSelectedUser(selectedUser);

            if (recipient == null || recipient.getId().equals(hostUserId)) {
                continue;
            }

            if (hasInvitationForRecipient(party, recipient)) {
                continue;
            }

            Invitation invitation = new Invitation();
            invitation.setSender(host);
            invitation.setRecipient(recipient);
            invitation.setParty(party);
            entityManager.persist(invitation);

            if (party.getInvitations() != null) {
                party.getInvitations().add(invitation);
            }

            String hostName = host.getDisplayName() != null ? host.getDisplayName() : host.getUsername();
            String message = hostName + " hat dich zu der Party \"" + party.getTitle() + "\" eingeladen";
            Notification notification = new Notification(recipient, host, party, message);
            notificationRepository.createNotification(notification);
            notifiedRecipientIds.add(recipient.getId());
        }

        return notifiedRecipientIds;
    }

    private boolean hasInvitationForRecipient(Party party, User recipient) {
        if (party.getInvitations() != null &&
                party.getInvitations().stream()
                        .anyMatch(i -> i.getRecipient() != null && i.getRecipient().getId().equals(recipient.getId()))) {
            return true;
        }

        if (party.getId() == null) {
            return false;
        }

        Long count = entityManager.createQuery(
                        "SELECT COUNT(i) FROM Invitation i WHERE i.party.id = :partyId AND i.recipient.id = :recipientId",
                        Long.class)
                .setParameter("partyId", party.getId())
                .setParameter("recipientId", recipient.getId())
                .getSingleResult();
        return count > 0;
    }

    private void notifyPartyUpdated(Party party, User sender, Long actorUserId, Set<Long> skippedUserIds) {
        String message = "\"" + party.getTitle() + "\" wurde aktualisiert. Schau dir die neuen Details in PartyHub an.";
        for (User recipient : collectPartyRecipients(party).values()) {
            if (recipient.getId() != null &&
                    !recipient.getId().equals(actorUserId) &&
                    (skippedUserIds == null || !skippedUserIds.contains(recipient.getId()))) {
                notificationRepository.createNotification(new Notification(recipient, sender, party, message));
            }
        }
    }

    private void notifyPartyDeleted(Party party) {
        String message = "Die Party \"" + party.getTitle() + "\" wurde geloescht.";
        for (User recipient : collectPartyRecipients(party).values()) {
            outOfAppNotificationService.send(recipient, "PartyHub: Party geloescht", message);
        }
    }

    private Map<Long, User> collectPartyRecipients(Party party) {
        Map<Long, User> recipients = new LinkedHashMap<>();

        if (party.getUsers() != null) {
            for (User attendee : party.getUsers()) {
                addRecipient(recipients, attendee);
            }
        }

        if (party.getInvitations() != null) {
            for (Invitation invitation : party.getInvitations()) {
                addRecipient(recipients, invitation.getRecipient());
            }
        }

        return recipients;
    }

    private void addRecipient(Map<Long, User> recipients, User user) {
        if (user != null && user.getId() != null) {
            recipients.putIfAbsent(user.getId(), user);
        }
    }

    private String partyUpdateSignature(Party party) {
        return Objects.toString(party.getTitle(), "") + "|" +
                Objects.toString(party.getDescription(), "") + "|" +
                Objects.toString(party.getFee(), "") + "|" +
                Objects.toString(party.getTime_start(), "") + "|" +
                Objects.toString(party.getTime_end(), "") + "|" +
                Objects.toString(party.getWebsite(), "") + "|" +
                Objects.toString(party.getMax_age(), "") + "|" +
                Objects.toString(party.getMin_age(), "") + "|" +
                Objects.toString(party.getMax_people(), "") + "|" +
                Objects.toString(party.getVisibility(), "") + "|" +
                Objects.toString(party.getTheme(), "") + "|" +
                (party.getLocation() != null ? Objects.toString(party.getLocation().getAddress(), "") : "") + "|" +
                (party.getLocation() != null ? Objects.toString(party.getLocation().getLatitude(), "") : "") + "|" +
                (party.getLocation() != null ? Objects.toString(party.getLocation().getLongitude(), "") : "");
    }

    public List<Party> findByTitleOrDescription(String q) {
        String like = "%" + q.trim().toLowerCase() + "%";
        String jpql = "SELECT p FROM Party p WHERE LOWER(p.title) LIKE :like OR LOWER(p.description) LIKE :like";
        return entityManager.createQuery(jpql, Party.class)
                .setParameter("like", like)
                .getResultList();
    }

    public List<Party> findByTheme(String theme) {
        String like = "%" + theme.trim().toLowerCase() + "%";
        String jpql = "SELECT p FROM Party p WHERE LOWER(p.theme) LIKE :theme";
        return entityManager.createQuery(jpql, Party.class)
                .setParameter("theme", like)
                .getResultList();
    }

    public List<Party> findByDateRange(String dateFrom, String dateTo) {
        if (dateFrom == null || dateTo == null) {
            throw new BadRequestException("date_from and date_to are required");
        }
        LocalDateTime start = parseDateTime(dateFrom);
        LocalDateTime end = parseDateTime(dateTo);

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

        if ("PUBLIC".equalsIgnoreCase(party.getVisibility())) {
            return party;
        }

        if (userId != null) {
            if (party.getHost_user().getId().equals(userId)) {
                return party;
            }

            boolean hasInvitation = party.getInvitations() != null && 
                    party.getInvitations().stream().anyMatch(i -> i.getRecipient().getId().equals(userId));
            if (hasInvitation) {
                return party;
            }

            if (party.getUsers() != null && party.getUsers().stream().anyMatch(u -> u.getId().equals(userId))) {
                return party;
            }
        }

        return null;
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

        Set<User> attendees = ensureUsers(party);

        if (!attendees.contains(user)) {
            attendees.add(user);
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

        Set<User> attendees = ensureUsers(party);

        if (attendees.contains(user)) {
            attendees.remove(user);
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

        Set<User> attendees = ensureUsers(party);
        boolean attending = attendees.contains(user);
        int count = attendees.size();

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
        party.setMax_people(dto.max_people());
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

        party.setTheme(dto.theme());
        party.setVisibility(normalizeVisibility(dto.visibility()));

        party.setCreated_at(LocalDateTime.now());
        return party;
    }

    private String normalizeVisibility(String visibility) {
        if (visibility == null || visibility.isBlank()) {
            return "PUBLIC";
        }

        return visibility.trim().equalsIgnoreCase("private") ? "PRIVATE" : "PUBLIC";
    }

    private User findSelectedUser(String selectedUser) {
        if (selectedUser == null || selectedUser.isBlank()) {
            return null;
        }

        String value = selectedUser.trim();

        try {
            return entityManager.find(User.class, Long.parseLong(value));
        } catch (NumberFormatException ignored) {
            return entityManager.createQuery(
                    "SELECT u FROM User u WHERE u.distinctName = :distinctName",
                    User.class)
                    .setParameter("distinctName", value)
                    .getResultStream()
                    .findFirst()
                    .orElse(null);
        }
    }

    private Set<User> ensureUsers(Party party) {
        if (party.getUsers() == null) {
            party.setUsers(new HashSet<>());
        }

        return party.getUsers();
    }
}
