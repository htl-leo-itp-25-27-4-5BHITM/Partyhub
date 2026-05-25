package at.htl.auth;

import io.quarkus.security.identity.IdentityProviderManager;
import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.security.identity.request.AuthenticationRequest;
import io.quarkus.security.runtime.QuarkusSecurityIdentity;
import io.quarkus.vertx.http.runtime.security.ChallengeData;
import io.quarkus.vertx.http.runtime.security.HttpAuthenticationMechanism;
import io.smallrye.mutiny.Uni;
import io.vertx.ext.web.RoutingContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.security.Principal;
import java.util.Collections;
import java.util.Set;

@ApplicationScoped
public class XUserIdAuthFilter implements HttpAuthenticationMechanism {

    @Inject
    Logger logger;

    @ConfigProperty(name = "partyhub.auth.bypass-enabled", defaultValue = "false")
    boolean bypassEnabled;

    @Override
    public Uni<SecurityIdentity> authenticate(RoutingContext context, IdentityProviderManager identityProviderManager) {
        if (!bypassEnabled) {
            return Uni.createFrom().nullItem();
        }

        String userId = context.request().getHeader("X-User-Id");
        if (userId == null || userId.isBlank()) {
            return Uni.createFrom().nullItem();
        }

        logger.debugf("XUserIdAuthFilter: authenticating user %s", userId);

        SecurityIdentity identity = QuarkusSecurityIdentity.builder()
                .setPrincipal(new Principal() {
                    @Override
                    public String getName() {
                        return userId;
                    }
                })
                .addRole("user")
                .build();

        return Uni.createFrom().item(identity);
    }

    @Override
    public Uni<ChallengeData> getChallenge(RoutingContext context) {
        return Uni.createFrom().nullItem();
    }

    @Override
    public Set<Class<? extends AuthenticationRequest>> getCredentialTypes() {
        return Collections.emptySet();
    }
}
