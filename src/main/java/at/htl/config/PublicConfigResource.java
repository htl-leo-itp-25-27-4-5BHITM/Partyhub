package at.htl.config;

import java.util.Map;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/config/public")
@ApplicationScoped
public class PublicConfigResource {

    @ConfigProperty(name = "partyhub.keycloak.issuer", defaultValue = "http://localhost:8000/realms/partyhub")
    String keycloakIssuer;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, String> getConfig() {
        return Map.of("keycloakIssuer", keycloakIssuer);
    }
}
