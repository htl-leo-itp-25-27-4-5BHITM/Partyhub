package at.htl.live;

import at.htl.auth.CurrentUserResolver;
import at.htl.party.PartyRepository;
import io.quarkus.security.Authenticated;
import io.vertx.core.http.HttpServerResponse;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
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

    @Inject
    PartyEvents partyEvents;

    @Inject
    PartyRepository partyRepository;

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

    /** Guest-list changes of one party, for logged-in users who may see that party. */
    @Authenticated
    @GET
    @Path("/parties/{partyId}/events")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    @Transactional
    public void partyEvents(@PathParam("partyId") Long partyId, @Context SseEventSink sink, @Context Sse sse,
                            @Context HttpServerResponse response) {
        Long userId = currentUserResolver.requireCurrentUserId();
        if (partyRepository.getPartyByIdIfVisible(partyId, userId) == null) {
            throw new NotFoundException("Party not found");
        }
        response.putHeader("X-Accel-Buffering", "no");
        response.putHeader("Cache-Control", "no-cache");
        partyEvents.subscribe(partyId, sink, sse);
    }
}
