package at.htl.invitation;

import java.util.List;
import java.util.Optional;

import at.htl.notification.Notification;
import at.htl.notification.NotificationRepository;
import at.htl.party.Party;
import at.htl.party.PartyRepository;
import at.htl.user.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class InvitationRepository {
    @Inject
    EntityManager entityManager;
    @Inject
    PartyRepository partyRepository;
    @Inject
    NotificationRepository notificationRepository;

    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_ACCEPTED = "ACCEPTED";
    private static final String STATUS_DECLINED = "DECLINED";

    public Response invite(InvitationDto invitationDto, Long senderId){
        if (senderId == null) {
                return Response.ok().entity(List.of()).build();
        }

        User sender = entityManager.find(User.class, senderId);
        if (sender == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Sender user not found\"}")
                    .build();
        }

        Party party = partyRepository.getPartyById(invitationDto.partyId());
        if (party == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Party not found\"}")
                    .build();
        }

        User recipient = entityManager.find(User.class, invitationDto.recipient());
        if (recipient == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Recipient user not found\"}")
                    .build();
        }

        Optional<Invitation> existingInvite = findInvitation(invitationDto.partyId(), invitationDto.recipient());
        if (existingInvite.isPresent()) {
            Invitation invitation = existingInvite.get();
            if (canReactivate(invitation, party, recipient)) {
                invitation.setStatus(STATUS_PENDING);
                entityManager.merge(invitation);
                sendInvitationNotification(recipient, sender, party);
                return Response.status(Response.Status.CREATED)
                        .entity("{\"message\": \"Invitation sent\"}")
                        .build();
            }

            return Response.status(Response.Status.CONFLICT).build();
        }

        Invitation invitation = new Invitation();
        invitation.setParty(party);
        invitation.setRecipient(recipient);
        invitation.setSender(sender);
        invitation.setStatus(STATUS_PENDING);
        entityManager.persist(invitation);
        if (party.getInvitations() != null) {
            party.getInvitations().add(invitation);
        }

        sendInvitationNotification(recipient, sender, party);
        return Response.status(Response.Status.CREATED)
                .entity("{\"message\": \"Invitation sent\"}")
                .build();
    }

    public List<Invitation> getReceivedInvites(Long userId){
        if (userId == null) {
            return List.of();
        }
        User user = entityManager.find(User.class, userId);
        if (user == null) {
            return List.of();
        }
        return entityManager.createQuery(
                        "select u from Invitation u where u.recipient = :user and (u.status is null or u.status = 'PENDING')",
                        Invitation.class)
                .setParameter("user", user)
                .getResultList();
    }

    public List<Invitation> getSentInvites(Long userId){
        if (userId == null) {
            return List.of();
        }
        User user = entityManager.find(User.class, userId);
        if (user == null) {
            return List.of();
        }
        return entityManager.createQuery("select u from Invitation u where u.sender = :user", Invitation.class).setParameter("user", user).getResultList();
    }

    public Response deleteInvite(Long id, Long userId){
    if (userId == null) {
        return Response.status(Response.Status.BAD_REQUEST)
                .entity("{\"error\": \"User ID required\"}")
                .build();
    }
    
    Invitation invitation = entityManager.find(Invitation.class, id);
    if (invitation == null) {
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    Long senderId = invitation.getSender() != null ? invitation.getSender().getId() : null;
    Long recipientId = invitation.getRecipient() != null ? invitation.getRecipient().getId() : null;
    
    if ((senderId == null || !senderId.equals(userId)) && 
        (recipientId == null || !recipientId.equals(userId))) {
        return Response.status(Response.Status.FORBIDDEN)
                .entity("{\"error\": \"Not authorized to delete this invitation\"}")
                .build();
    }
    
    if (recipientId != null && recipientId.equals(userId)) {
        Party party = invitation.getParty();
        boolean isAttending = party != null &&
                party.getUsers() != null &&
                party.getUsers().stream()
                        .anyMatch(user -> user.getId() != null && user.getId().equals(userId));

        invitation.setStatus(isAttending ? STATUS_ACCEPTED : STATUS_DECLINED);
        entityManager.merge(invitation);
        return Response.noContent().build();
    }

    Party party = invitation.getParty();
    if (party != null && party.getInvitations() != null) {
        party.getInvitations().remove(invitation);
    }
    entityManager.remove(invitation);
    return Response.noContent().build(); 
    }

    private Optional<Invitation> findInvitation(Long partyId, Long recipientId) {
        return entityManager.createQuery(
                        "select i from Invitation i where i.recipient.id = :recipientId and i.party.id = :partyId",
                        Invitation.class)
                .setParameter("recipientId", recipientId)
                .setParameter("partyId", partyId)
                .getResultStream()
                .findFirst();
    }

    private boolean canReactivate(Invitation invitation, Party party, User recipient) {
        String status = invitation.getStatus();
        boolean attending = party.getUsers() != null &&
                party.getUsers().stream()
                        .anyMatch(user -> user.getId() != null && user.getId().equals(recipient.getId()));

        return STATUS_DECLINED.equalsIgnoreCase(status) ||
                (STATUS_ACCEPTED.equalsIgnoreCase(status) && !attending);
    }

    private void sendInvitationNotification(User recipient, User sender, Party party) {
        String hostName = sender.getDisplayName() != null && !sender.getDisplayName().isBlank()
                ? sender.getDisplayName()
                : sender.getUsername();
        if (hostName == null || hostName.isBlank()) {
            hostName = sender.getDistinctName();
        }
        if (hostName == null || hostName.isBlank()) {
            hostName = "Someone";
        }

        String partyTitle = party.getTitle() != null ? party.getTitle() : "a party";
        String message = hostName + " invited you to the party \"" + partyTitle + "\"";
        notificationRepository.createNotification(new Notification(recipient, sender, party, message));
    }
}
