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

        boolean exists = !entityManager.createQuery(
                        "select i from Invitation i where i.recipient.id = :recipientId and i.party.id = :partyId", Invitation.class)
                .setParameter("recipientId", invitationDto.recipient())
                .setParameter("partyId", invitationDto.partyId())
                .getResultList().isEmpty();
        if (exists){
            return Response.status(Response.Status.CONFLICT).build();
        }
        Invitation invitation = new Invitation();
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

        invitation.setParty(party);
        invitation.setRecipient(recipient);
        invitation.setSender(sender);
        entityManager.persist(invitation);

        String hostName = sender.getDisplayName() != null ? sender.getDisplayName() : sender.getUsername();
        String message = hostName + " hat dich zu der Party \"" + party.getTitle() + "\" eingeladen";
        notificationRepository.createNotification(new Notification(recipient, sender, party, message));

        return Response.status(Response.Status.CREATED).build();
    }

    public List<Invitation> getReceivedInvites(Long userId){
        if (userId == null) {
            return List.of();
        }
        User user = entityManager.find(User.class, userId);
        if (user == null) {
            return List.of();
        }
        return entityManager.createQuery("select u from Invitation u where u.recipient = :user", Invitation.class).setParameter("user", user).getResultList();
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
    
    entityManager.remove(invitation);
    return Response.noContent().build(); 
    }}
