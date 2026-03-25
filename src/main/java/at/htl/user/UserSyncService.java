package at.htl.user;

import io.quarkus.security.identity.AuthenticationRequestContext;
import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.security.identity.SecurityIdentityAugmentor;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.jboss.logging.Logger;

import java.util.UUID;

@ApplicationScoped
public class UserSyncService implements SecurityIdentityAugmentor {

    @Inject
    EntityManager em;

    @Inject
    Logger logger;

    @Override
    public Uni<SecurityIdentity> augment(SecurityIdentity identity, AuthenticationRequestContext context) {
        return context.runBlocking(() -> augmentBlocking(identity));
    }

    private SecurityIdentity augmentBlocking(SecurityIdentity identity) {
        if (identity == null || identity.getPrincipal() == null) {
            return identity;
        }

        String principalName = identity.getPrincipal().getName();
        if (principalName == null || principalName.isBlank()) {
            return identity;
        }

        try {
            UUID userId = UUID.fromString(principalName);
            
            User user = em.find(User.class, userId);
            if (user == null) {
                String email = identity.getAttribute("email");
                
                user = new User(userId);
                if (email != null) {
                    user.setEmail(email);
                }
                em.persist(user);
                em.flush();
                logger.infof("Auto-created user with ID: %s", userId);
            }
        } catch (IllegalArgumentException e) {
            logger.warnf("Principal %s is not a valid UUID", principalName);
        } catch (Exception e) {
            logger.errorf("Error syncing user: %s", e.getMessage());
        }
        
        return identity;
    }
}
