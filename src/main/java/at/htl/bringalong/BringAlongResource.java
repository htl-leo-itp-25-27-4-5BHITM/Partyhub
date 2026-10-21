package at.htl.bringalong;

import at.htl.auth.CurrentUserResolver;
import at.htl.party.Party;
import at.htl.party.PartyRepository;
import at.htl.user.User;
import io.quarkus.security.Authenticated;
import io.vertx.core.http.HttpServerResponse;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.sse.Sse;
import jakarta.ws.rs.sse.SseEventSink;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@ApplicationScoped
@Path("/api/parties/{partyId}/bring-along")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
public class BringAlongResource {
    @Inject EntityManager em;
    @Inject CurrentUserResolver currentUser;
    @Inject PartyRepository parties;
    @Inject BringAlongEvents events;
    @Inject Event<BringAlongChanged> changed;

    private record Member(Party party, Long userId, boolean host) {}

    @GET
    @Transactional
    public List<BringAlongItemDto> list(@PathParam("partyId") Long partyId) {
        Member member = requireMember(partyId);
        List<BringAlongItem> items = em.createQuery(
                        "select i from BringAlongItem i where i.party.id = :partyId order by i.createdAt, i.id",
                        BringAlongItem.class)
                .setParameter("partyId", member.party().getId()).getResultList();
        Map<Long, List<BringAlongPledge>> pledges = em.createQuery(
                        "select p from BringAlongPledge p join fetch p.user where p.item.party.id = :partyId order by p.id",
                        BringAlongPledge.class)
                .setParameter("partyId", member.party().getId()).getResultList().stream()
                .collect(Collectors.groupingBy(p -> p.item.id));
        return items.stream().map(i -> BringAlongItemDto.from(i, pledges.getOrDefault(i.id, List.of()))).toList();
    }

    @GET
    @Path("/events")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    @Transactional
    public void events(@PathParam("partyId") Long partyId, @Context SseEventSink sink, @Context Sse sse,
                       @Context HttpServerResponse response) {
        requireMember(partyId);
        // Stop nginx-style proxies from buffering the stream.
        response.putHeader("X-Accel-Buffering", "no");
        response.putHeader("Cache-Control", "no-cache");
        events.subscribe(partyId, sink, sse);
    }

    @POST
    @Path("/items")
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional
    public Response createItem(@PathParam("partyId") Long partyId, @Valid BringAlongItemRequest request) {
        Member member = requireHost(partyId);
        BringAlongItem item = new BringAlongItem();
        item.party = member.party();
        item.createdAt = LocalDateTime.now();
        apply(item, request);
        em.persist(item);
        changed.fire(new BringAlongChanged(partyId));
        return Response.status(Response.Status.CREATED).entity(BringAlongItemDto.from(item, List.of())).build();
    }

    @PUT
    @Path("/items/{itemId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional
    public BringAlongItemDto updateItem(@PathParam("partyId") Long partyId, @PathParam("itemId") Long itemId,
                                        @Valid BringAlongItemRequest request) {
        requireHost(partyId);
        BringAlongItem item = requireItem(partyId, itemId, LockModeType.NONE);
        apply(item, request);
        changed.fire(new BringAlongChanged(partyId));
        return BringAlongItemDto.from(item, pledgesOf(itemId));
    }

    @DELETE
    @Path("/items/{itemId}")
    @Transactional
    public Response deleteItem(@PathParam("partyId") Long partyId, @PathParam("itemId") Long itemId) {
        requireHost(partyId);
        BringAlongItem item = requireItem(partyId, itemId, LockModeType.NONE);
        em.createQuery("delete from BringAlongPledge p where p.item.id = :itemId")
                .setParameter("itemId", itemId).executeUpdate();
        em.remove(item);
        changed.fire(new BringAlongChanged(partyId));
        return Response.noContent().build();
    }

    @PUT
    @Path("/items/{itemId}/pledge")
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional
    public Response pledge(@PathParam("partyId") Long partyId, @PathParam("itemId") Long itemId,
                           @Valid BringAlongPledgeRequest request) {
        Member member = requireMember(partyId);
        // Lock the item so concurrent pledges cannot together exceed the required quantity.
        BringAlongItem item = requireItem(partyId, itemId, LockModeType.PESSIMISTIC_WRITE);
        List<BringAlongPledge> pledges = pledgesOf(itemId);
        BringAlongPledge own = pledges.stream()
                .filter(p -> p.user.getId().equals(member.userId())).findFirst().orElse(null);
        int others = pledges.stream().filter(p -> p != own).mapToInt(p -> p.quantity).sum();
        int available = Math.max(0, item.quantity - others);
        if (request.quantity() > available) {
            return Response.status(Response.Status.CONFLICT).entity(Map.of(
                    "error", available == 0 ? "Item is already covered" : "Only " + available + " still needed",
                    "remaining", available,
                    "item", BringAlongItemDto.from(item, pledges))).build();
        }
        if (own == null) {
            BringAlongPledge pledge = new BringAlongPledge();
            pledge.item = item;
            pledge.user = em.find(User.class, member.userId());
            pledge.quantity = request.quantity();
            em.persist(pledge);
        } else {
            own.quantity = request.quantity();
        }
        em.flush();
        changed.fire(new BringAlongChanged(partyId));
        return Response.ok(BringAlongItemDto.from(item, pledgesOf(itemId))).build();
    }

    @DELETE
    @Path("/items/{itemId}/pledge")
    @Transactional
    public Response withdrawPledge(@PathParam("partyId") Long partyId, @PathParam("itemId") Long itemId) {
        Member member = requireMember(partyId);
        requireItem(partyId, itemId, LockModeType.NONE);
        int removed = em.createQuery("delete from BringAlongPledge p where p.item.id = :itemId and p.user.id = :userId")
                .setParameter("itemId", itemId).setParameter("userId", member.userId()).executeUpdate();
        if (removed > 0) changed.fire(new BringAlongChanged(partyId));
        return Response.noContent().build();
    }

    private static void apply(BringAlongItem item, BringAlongItemRequest request) {
        item.name = request.name().strip();
        item.unit = request.unit() == null || request.unit().isBlank() ? null : request.unit().strip();
        item.quantity = request.quantity();
    }

    private List<BringAlongPledge> pledgesOf(Long itemId) {
        return em.createQuery("select p from BringAlongPledge p join fetch p.user where p.item.id = :itemId order by p.id",
                        BringAlongPledge.class)
                .setParameter("itemId", itemId).getResultList();
    }

    private Member requireMember(Long partyId) {
        Long userId = currentUser.requireCurrentUserId();
        Party party = parties.getPartyByIdIfVisible(partyId, userId);
        if (party == null) throw error(Response.Status.NOT_FOUND, "Party not found");
        boolean host = party.getHost_user() != null && party.getHost_user().getId().equals(userId);
        boolean attendee = em.createQuery(
                        "select count(u) from Party p join p.users u where p.id = :partyId and u.id = :userId", Long.class)
                .setParameter("partyId", partyId).setParameter("userId", userId).getSingleResult() > 0;
        if (!host && !attendee) throw error(Response.Status.FORBIDDEN, "Join the party to use the bring-along list");
        return new Member(party, userId, host);
    }

    private Member requireHost(Long partyId) {
        Member member = requireMember(partyId);
        if (!member.host()) throw error(Response.Status.FORBIDDEN, "Only the host can manage bring-along items");
        return member;
    }

    private BringAlongItem requireItem(Long partyId, Long itemId, LockModeType lock) {
        BringAlongItem item = em.find(BringAlongItem.class, itemId, lock);
        if (item == null || !item.party.getId().equals(partyId)) throw error(Response.Status.NOT_FOUND, "Item not found");
        return item;
    }

    private static WebApplicationException error(Response.Status status, String message) {
        return new WebApplicationException(Response.status(status)
                .type(MediaType.APPLICATION_JSON).entity(Map.of("error", message)).build());
    }
}
