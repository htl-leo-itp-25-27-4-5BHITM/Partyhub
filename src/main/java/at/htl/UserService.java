package at.htl;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import org.eclipse.microprofile.jwt.JsonWebToken;

@RequestScoped
@Path("/whoami")
public class UserService {

    @Inject
    JsonWebToken jwt;
    @GET
    public String whoAmI(@Context HttpHeaders headers) {
        String auth = headers.getHeaderString(HttpHeaders.AUTHORIZATION);
        if (auth == null) {
            return "No Authorization header – request likely not authenticated.";
        }
        return "Header present: " + auth.substring(0, Math.min(auth.length(), 30)) + "...";
    }
}

