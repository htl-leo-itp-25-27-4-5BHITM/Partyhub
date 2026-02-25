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

    public Response invite(InvitationDto invitationDto){
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
        // TODO: Use current user
        invitation.setSender(userRepository.getUser(1L));
        entityManager.persist(invitation);
        return Response.ok().build();
    }

    public List<Invitation> getReceivedInvites(){
        User user = entityManager.find(User.class, 1L);
        return entityManager.createQuery("select u from Invitation u where u.recipient = :user", Invitation.class).setParameter("user", user).getResultList();
    }

    public List<Invitation> getSentInvites(){
        User user = entityManager.find(User.class, 1L);
        return entityManager.createQuery("select u from Invitation u where u.sender = :user", Invitation.class).setParameter("user", user).getResultList();
    }

    // TODO: Check user permission
    public Response deleteInvite(Long id){
        Invitation invitation = entityManager.find(Invitation.class, id);
        if (invitation == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        entityManager.remove(invitation);
        return Response.ok().build();
    }
}