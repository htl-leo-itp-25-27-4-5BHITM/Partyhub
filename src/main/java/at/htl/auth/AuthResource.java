package at.htl.auth;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.jwt.JsonWebToken;

import jakarta.inject.Inject;
import java.net.URI;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    JsonWebToken jwt;

    @ConfigProperty(name = "quarkus.oidc.auth-server-url", defaultValue = "http://localhost:8180/realms/partyhub")
    String keycloakServerUrl;

    @GET
    @Path("/logout")
    public Response logout() {
        String logoutUrl = keycloakServerUrl + "/protocol/openid-connect/logout";
        return Response.ok()
            .entity("{\"logoutUrl\": \"" + logoutUrl + "\"}")
            .build();
    }

    @GET
    @Path("/me")
    public Response getCurrentUser() {
        if (jwt == null || jwt.getSubject() == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        return Response.ok()
            .entity("{\"sub\": \"" + jwt.getSubject() + "\", \"email\": \"" + jwt.getClaim("email") + "\"}")
            .build();
    }
}
