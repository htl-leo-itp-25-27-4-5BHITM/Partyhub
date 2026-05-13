package at.htl.party;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

import at.htl.location.Location;
import at.htl.location.LocationRepository;
import at.htl.user.User;
import at.htl.invitation.Invitation;
import at.htl.notification.Notification;
import at.htl.notification.NotificationRepository;
import at.htl.notification.OutOfAppNotificationService;
import at.htl.follow.FollowRepository;
import at.htl.websocket.WebSocketSessionManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriBuilder;

import java.util.stream.Collectors;

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

    @Inject
    WebSocketSessionManager webSocketSessionManager;

    @Inject
    ObjectMapper objectMapper;

    private static final DateTimeFormatter PARTY_DTF = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
    private static final String INVITATION_PENDING = "PENDING";
    private static final String INVITATION_ACCEPTED = "ACCEPTED";
    private static final String INVITATION_DECLINED = "DECLINED";

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

        List<User> followers = followRepository.getFollowers(userId);
        Set<Long> followerIds = followers.stream()
                .map(User::getId)
                .collect(Collectors.toSet());
        if (!followerIds.isEmpty()) {
            try {
                var partyMap = new HashMap<String, Object>();
                partyMap.put("id", party.getId());
                partyMap.put("title", party.getTitle());
                partyMap.put("theme", party.getTheme());
                partyMap.put("time_start", party.getTime_start() != null ? party.getTime_start().toString() : "");
                partyMap.put("time_end", party.getTime_end() != null ? party.getTime_end().toString() : "");
                partyMap.put("visibility", party.getVisibility());
                partyMap.put("creatorId", userId);
                String payload = objectMapper.writeValueAsString(Map.of(
                        "type", "PARTY_CREATED",
                        "party", partyMap
                ));
                webSocketSessionManager.broadcastToUsers(followerIds, payload);
            } catch (Exception e) {
                io.quarkus.logging.Log.warn("WebSocket broadcast failed for PARTY_CREATED", e);
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
        notifyCancellationRecipients(party);
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

        Set<Long> memberIds = party.getUsers() != null
                ? party.getUsers().stream().map(User::getId).collect(Collectors.toSet())
                : new HashSet<>();
        if (!memberIds.isEmpty()) {
            try {
                var partyMap = new HashMap<String, Object>();
                partyMap.put("id", party.getId());
                partyMap.put("title", party.getTitle());
                partyMap.put("description", party.getDescription());
                partyMap.put("time_start", party.getTime_start() != null ? party.getTime_start().toString() : "");
                partyMap.put("time_end", party.getTime_end() != null ? party.getTime_end().toString() : "");
                partyMap.put("visibility", party.getVisibility());
                String payload = objectMapper.writeValueAsString(Map.of(
                        "type", "PARTY_UPDATED",
                        "party", partyMap
                ));
                webSocketSessionManager.broadcastToUsers(memberIds, payload);
            } catch (Exception e) {
                io.quarkus.logging.Log.warn("WebSocket broadcast failed for PARTY_UPDATED", e);
            }
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

            Optional<Invitation> existingInvitation = findInvitationForRecipient(party, recipient);
            if (existingInvitation.isPresent()) {
                Invitation invitation = existingInvitation.get();
                if (!shouldSendRenewedInvitation(invitation, party, recipient)) {
                    continue;
                }

                invitation.setStatus(INVITATION_PENDING);
                entityManager.merge(invitation);
                sendInvitationNotification(recipient, host, party);
                notifiedRecipientIds.add(recipient.getId());
                continue;
            }

            Invitation invitation = new Invitation();
            invitation.setSender(host);
            invitation.setRecipient(recipient);
            invitation.setParty(party);
            invitation.setStatus(INVITATION_PENDING);
            entityManager.persist(invitation);

            if (party.getInvitations() != null) {
                party.getInvitations().add(invitation);
            }

            sendInvitationNotification(recipient, host, party);
            notifiedRecipientIds.add(recipient.getId());
        }

        return notifiedRecipientIds;
    }

    private boolean hasInvitationForRecipient(Party party, User recipient) {
        return findInvitationForRecipient(party, recipient).isPresent();
    }

    private Optional<Invitation> findInvitationForRecipient(Party party, User recipient) {
        if (party == null || recipient == null || recipient.getId() == null) {
            return Optional.empty();
        }

        if (party.getInvitations() != null &&
                party.getInvitations().stream()
                        .anyMatch(i -> i.getRecipient() != null && i.getRecipient().getId().equals(recipient.getId()))) {
            return party.getInvitations().stream()
                    .filter(i -> i.getRecipient() != null && i.getRecipient().getId().equals(recipient.getId()))
                    .findFirst();
        }

        if (party.getId() == null) {
            return Optional.empty();
        }

        return entityManager.createQuery(
                        "SELECT i FROM Invitation i WHERE i.party.id = :partyId AND i.recipient.id = :recipientId",
                        Invitation.class)
                .setParameter("partyId", party.getId())
                .setParameter("recipientId", recipient.getId())
                .getResultStream()
                .findFirst();
    }

    private boolean shouldSendRenewedInvitation(Invitation invitation, Party party, User recipient) {
        String status = invitation.getStatus();
        boolean attending = party.getUsers() != null &&
                party.getUsers().stream()
                        .anyMatch(user -> user.getId() != null && user.getId().equals(recipient.getId()));

        return INVITATION_DECLINED.equalsIgnoreCase(status) ||
                (INVITATION_ACCEPTED.equalsIgnoreCase(status) && !attending);
    }

    private void sendInvitationNotification(User recipient, User host, Party party) {
        notificationRepository.deleteInvitationNotifications(
                party.getId(),
                host.getId(),
                recipient.getId()
        );
        String hostName = displayName(host);
        String message = hostName + " invited you to the party \"" + party.getTitle() + "\"";
        Notification notification = new Notification(recipient, host, party, message);
        notificationRepository.createNotification(notification);
    }

    private void notifyCancellationRecipients(Party party) {
        User host = party.getHost_user();
        if (host == null) {
            return;
        }

        Set<Long> notifiedUserIds = new HashSet<>();

        if ("PRIVATE".equalsIgnoreCase(party.getVisibility())) {
            if (party.getInvitations() != null) {
                for (Invitation invitation : party.getInvitations()) {
                    notifyCancellationRecipient(party, host, invitation.getRecipient(), notifiedUserIds);
                }
            }
        }

        if (party.getUsers() != null) {
            for (User attendee : party.getUsers()) {
                notifyCancellationRecipient(party, host, attendee, notifiedUserIds);
            }
        }
    }

    private void notifyCancellationRecipient(
            Party party,
            User host,
            User recipient,
            Set<Long> notifiedUserIds) {
        if (recipient == null || recipient.getId() == null) {
            return;
        }

        if (host.getId() != null && host.getId().equals(recipient.getId())) {
            return;
        }

        if (!notifiedUserIds.add(recipient.getId())) {
            return;
        }

        String message = "The party \"" + party.getTitle() + "\" was canceled.";
        Notification notification = new Notification(recipient, host, null, message);
        notificationRepository.createNotification(notification);
    }

    private void notifyPartyUpdated(Party party, User sender, Long actorUserId, Set<Long> skippedUserIds) {
        String message = "\"" + party.getTitle() + "\" was updated. Check the new details in PartyHub.";
        for (User recipient : collectPartyRecipients(party).values()) {
            if (recipient.getId() != null &&
                    !recipient.getId().equals(actorUserId) &&
                    (skippedUserIds == null || !skippedUserIds.contains(recipient.getId()))) {
                notificationRepository.createNotification(new Notification(recipient, sender, party, message));
            }
        }
    }

    private void notifyPartyDeleted(Party party) {
        String message = "The party \"" + party.getTitle() + "\" was deleted.";
        for (User recipient : collectPartyRecipients(party).values()) {
            outOfAppNotificationService.send(recipient, "PartyHub: Party deleted", message);
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

    public Response getInvitedMembers(Long partyId, Long userId) {
        Party party = getPartyByIdIfVisible(partyId, userId);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        Set<Long> attendeeIds = new HashSet<>();
        if (party.getUsers() != null) {
            for (User attendee : party.getUsers()) {
                if (attendee.getId() != null) {
                    attendeeIds.add(attendee.getId());
                }
            }
        }

        List<Invitation> invitations = entityManager.createQuery(
                        "SELECT i FROM Invitation i " +
                                "LEFT JOIN FETCH i.recipient " +
                                "WHERE i.party.id = :partyId " +
                                "ORDER BY i.recipient.displayName, i.recipient.distinctName",
                        Invitation.class)
                .setParameter("partyId", partyId)
                .getResultList();

        List<InvitedMemberDto> invitedMembers = invitations.stream()
                .filter(invitation -> invitation.getRecipient() != null)
                .map(invitation -> {
                    User recipient = invitation.getRecipient();
                    String status = invitationStatusForDisplay(invitation, attendeeIds);
                    return new InvitedMemberDto(
                            recipient.getId(),
                            recipient.getUsername(),
                            recipient.getDisplayName(),
                            recipient.getDistinctName(),
                            status
                    );
                })
                .toList();

        return Response.ok(invitedMembers).build();
    }

    public Response getJoinedMembers(Long partyId, Long userId) {
        Party party = getPartyByIdIfVisible(partyId, userId);
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        List<User> attendees = entityManager.createQuery(
                        "SELECT u FROM Party p JOIN p.users u " +
                                "WHERE p.id = :partyId " +
                                "ORDER BY u.displayName, u.username, u.distinctName",
                        User.class)
                .setParameter("partyId", partyId)
                .getResultList();

        List<InvitedMemberDto> joinedMembers = attendees.stream()
                .map(user -> new InvitedMemberDto(
                        user.getId(),
                        user.getUsername(),
                        user.getDisplayName(),
                        user.getDistinctName(),
                        "JOINED"
                ))
                .toList();

        return Response.ok(joinedMembers).build();
    }

    private String invitationStatusForDisplay(Invitation invitation, Set<Long> attendeeIds) {
        User recipient = invitation.getRecipient();
        String status = invitation.getStatus();

        if ("DECLINED".equalsIgnoreCase(status)) {
            return "DECLINED";
        }

        if ("ACCEPTED".equalsIgnoreCase(status) ||
                (recipient != null && recipient.getId() != null && attendeeIds.contains(recipient.getId()))) {
            return "ACCEPTED";
        }

        return "PENDING";
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
            Optional<Invitation> invitation = findInvitationForRecipient(party, user);
            attendees.add(user);
            if (invitation.isPresent()) {
                invitation.get().setStatus(INVITATION_ACCEPTED);
                entityManager.merge(invitation.get());
                Long senderId = invitation.get().getSender() != null
                        ? invitation.get().getSender().getId()
                        : null;
                notificationRepository.deleteInvitationNotifications(party.getId(), senderId, user.getId());
                notifyHost(party, user, displayName(user) + " accepted your invitation to the party \"" + party.getTitle() + "\".");
            }
        }

        Set<Long> otherMemberIds = attendees.stream()
                .map(User::getId)
                .filter(id -> !id.equals(userId))
                .collect(Collectors.toSet());
        if (!otherMemberIds.isEmpty()) {
            try {
                var userMap = new HashMap<String, Object>();
                userMap.put("id", user.getId());
                userMap.put("name", displayName(user));
                String payload = objectMapper.writeValueAsString(Map.of(
                        "type", "PARTY_MEMBER_JOINED",
                        "partyId", party.getId(),
                        "user", userMap
                ));
                webSocketSessionManager.broadcastToUsers(otherMemberIds, payload);
            } catch (Exception e) {
                io.quarkus.logging.Log.warn("WebSocket broadcast failed for PARTY_MEMBER_JOINED", e);
            }
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
            Optional<Invitation> invitation = findInvitationForRecipient(party, user);
            if (invitation.isPresent()) {
                invitation.get().setStatus(INVITATION_DECLINED);
                entityManager.merge(invitation.get());
            }
            notifyHost(party, user, displayName(user) + " left the party \"" + party.getTitle() + "\".");

            Set<Long> remainingMemberIds = attendees.stream()
                    .map(User::getId)
                    .collect(Collectors.toSet());
            if (!remainingMemberIds.isEmpty()) {
                try {
                    String payload = objectMapper.writeValueAsString(Map.of(
                            "type", "PARTY_MEMBER_LEFT",
                            "partyId", party.getId(),
                            "userId", userId
                    ));
                    webSocketSessionManager.broadcastToUsers(remainingMemberIds, payload);
                } catch (Exception e) {
                    io.quarkus.logging.Log.warn("WebSocket broadcast failed for PARTY_MEMBER_LEFT", e);
                }
            }

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

    private void notifyHost(Party party, User actor, String message) {
        User host = party.getHost_user();
        if (host == null || actor == null) {
            return;
        }

        if (host.getId() != null && host.getId().equals(actor.getId())) {
            return;
        }

        Notification notification = new Notification(host, actor, party, message);
        notificationRepository.createNotification(notification);
    }

    private String displayName(User user) {
        if (user == null) {
            return "Someone";
        }
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName();
        }
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername();
        }
        if (user.getDistinctName() != null && !user.getDistinctName().isBlank()) {
            return user.getDistinctName();
        }
        return "Someone";
    }
}
