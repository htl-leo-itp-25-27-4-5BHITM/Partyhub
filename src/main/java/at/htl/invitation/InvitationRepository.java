package at.htl.invitation;

import java.util.List;

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

    public Response invite(InvitationDto invitationDto, Long senderId) {
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
        User recipient = entityManager.find(User.class, invitationDto.recipient());
        if (party == null && recipient != null) {
            Party swappedParty = partyRepository.getPartyById(invitationDto.recipient());
            User swappedRecipient = entityManager.find(User.class, invitationDto.partyId());
            if (swappedParty != null && swappedRecipient != null) {
                party = swappedParty;
                recipient = swappedRecipient;
            }
        }

        if (party == null || recipient == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Party or recipient user not found\"}")
                    .build();
        }

        Invitation existingInvitation = findInvitation(party.getId(), recipient.getId());
        if (existingInvitation != null) {
            if (!"DECLINED".equalsIgnoreCase(existingInvitation.getStatus())) {
                return Response.status(Response.Status.CONFLICT).build();
            }

            existingInvitation.setStatus("PENDING");
            entityManager.merge(existingInvitation);
            sendInvitationNotification(recipient, sender, party);
            return Response.status(Response.Status.CREATED).build();
        }

        Invitation invitation = new Invitation();
        invitation.setParty(party);
        invitation.setRecipient(recipient);
        invitation.setSender(sender);
        invitation.setStatus("PENDING");
        entityManager.persist(invitation);

        if (party.getInvitations() != null) {
            party.getInvitations().add(invitation);
        }

        sendInvitationNotification(recipient, sender, party);

        return Response.status(Response.Status.CREATED).build();
    }

    public List<Invitation> getReceivedInvites(Long userId) {
        if (userId == null) {
            return List.of();
        }
        User user = entityManager.find(User.class, userId);
        if (user == null) {
            return List.of();
        }
        return entityManager.createQuery(
                        "select u from Invitation u where u.recipient = :user",
                        Invitation.class)
                .setParameter("user", user)
                .getResultList();
    }

    public List<Invitation> getSentInvites(Long userId) {
        if (userId == null) {
            return List.of();
        }
        User user = entityManager.find(User.class, userId);
        if (user == null) {
            return List.of();
        }
        return entityManager.createQuery("select u from Invitation u where u.sender = :user", Invitation.class)
                .setParameter("user", user)
                .getResultList();
    }

    public Response deleteInvite(Long id, Long userId) {
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
        Long partyId = invitation.getParty() != null ? invitation.getParty().getId() : null;
        boolean isSender = senderId != null && senderId.equals(userId);
        boolean isRecipient = recipientId != null && recipientId.equals(userId);

        if (!isSender && !isRecipient) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity("{\"error\": \"Not authorized to delete this invitation\"}")
                    .build();
        }

        notificationRepository.deleteInvitationNotifications(partyId, senderId, recipientId);

        if (isRecipient) {
            invitation.setStatus("DECLINED");
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

    private Invitation findInvitation(Long partyId, Long recipientId) {
        List<Invitation> result = entityManager.createQuery(
                        "select i from Invitation i where i.party.id = :partyId and i.recipient.id = :recipientId",
                        Invitation.class)
                .setParameter("partyId", partyId)
                .setParameter("recipientId", recipientId)
                .setMaxResults(1)
                .getResultList();
        return result.isEmpty() ? null : result.get(0);
    }

    private void sendInvitationNotification(User recipient, User sender, Party party) {
        notificationRepository.deleteInvitationNotifications(
                party.getId(),
                sender.getId(),
                recipient.getId()
        );
        String hostName = sender.getDisplayName() != null ? sender.getDisplayName() : sender.getUsername();
        String message = hostName + " invited you to the party \"" + party.getTitle() + "\"";
        notificationRepository.createNotification(new Notification(recipient, sender, party, message));
    }
}
