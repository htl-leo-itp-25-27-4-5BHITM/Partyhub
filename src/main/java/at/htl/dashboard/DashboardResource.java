package at.htl.dashboard;

import at.htl.auth.CurrentUserResolver;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.CacheControl;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

/** Personal host statistics of the authenticated user. Read-only. */
@Path("/api/dashboard")
public class DashboardResource {

    @Inject
    CurrentUserResolver currentUserResolver;

    @Inject
    DashboardService dashboardService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Authenticated
    public Response getDashboard(@QueryParam("range") String range) {
        Optional<DashboardRange> parsed = DashboardRange.parse(range);
        if (parsed.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "range must be one of 7d, 30d, 3m, 6m"))
                    .build();
        }
        long hostId = currentUserResolver.requireCurrentUserId();
        CacheControl noStore = new CacheControl();
        noStore.setNoStore(true);
        noStore.setPrivate(true);
        return Response.ok(dashboardService.build(hostId, parsed.get(), LocalDateTime.now()))
                .cacheControl(noStore)
                .build();
    }
}
