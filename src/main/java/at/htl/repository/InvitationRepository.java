package at.htl.repository;

import at.htl.dto.InvitationDto;
import at.htl.model.Invitation;
import at.htl.model.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.core.Response;

import java.util.List;

@ApplicationScoped
public class InvitationRepository {
    @Inject
    EntityManager entityManager;
    @Inject
    PartyRepository partyRepository;
    @Inject
    UserRepository userRepository;

    public Response invite(InvitationDto invitationDto){
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

    public Response deleteInvite(Long id){
        Invitation invitation = entityManager.find(Invitation.class, id);
        entityManager.remove(invitation);
        return Response.ok().build();
    }
}