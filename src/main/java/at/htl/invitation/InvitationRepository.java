package at.htl.invitation;

import at.htl.party.PartyRepository;
import at.htl.user.User;
import at.htl.user.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.List;

@ApplicationScoped
public class InvitationRepository {
    @Inject
    EntityManager entityManager;
    @Inject
    PartyRepository partyRepository;
    @Inject
    UserRepository userRepository;
    @Inject
    Logger logger;

    public Response invite(InvitationDto invitationDto, Long senderId){
        if (senderId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Sender User ID required\"}")
                    .build();
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
        invitation.setParty(partyRepository.getPartyById(invitationDto.partyId()));
        invitation.setRecipient(userRepository.getUser(invitationDto.recipient()));
        invitation.setSender(sender);
        entityManager.persist(invitation);
        return Response.ok().build();
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

        if (invitation.getSender() == null || !invitation.getSender().getId().equals(userId)) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity("{\"error\": \"Not authorized to delete this invitation\"}")
                    .build();
        }
        
        entityManager.remove(invitation);
        return Response.ok().build();
    }
}
