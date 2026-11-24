package at.htl.live;

import at.htl.auth.CurrentUserResolver;
import io.quarkus.security.Authenticated;
import io.vertx.core.http.HttpServerResponse;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.sse.Sse;
import jakarta.ws.rs.sse.SseEventSink;

/** One live stream per browser tab: tells the logged-in user when their data changed. */
@Path("/api/live")
public class LiveResource {

    @Inject
    CurrentUserResolver currentUserResolver;

    @Inject
    UserEvents events;

    @Authenticated
    @GET
    @Path("/events")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    @Transactional
    public void events(@Context SseEventSink sink, @Context Sse sse, @Context HttpServerResponse response) {
        Long userId = currentUserResolver.requireCurrentUserId();
        // Stop nginx-style proxies from buffering the stream.
        response.putHeader("X-Accel-Buffering", "no");
        response.putHeader("Cache-Control", "no-cache");
        events.subscribe(userId, sink, sse);
    }
}
