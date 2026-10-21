package at.htl.media;

import at.htl.auth.CurrentUserResolver;
import io.quarkus.security.Authenticated;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
@Path("/api/media")
public class MediaResource {

    @Inject
    MediaRepository mediaRepository;
    @Inject
    CurrentUserResolver currentUserResolver;

    /**
     * Serves a gallery image to anyone who may view its party (anonymous callers only for
     * public parties). Missing, invisible and unreadable items all return 404 so the
     * response does not reveal whether a private item exists.
     */
    @GET
    @Path("/{id}")
    @Transactional
    public Response getMedia(@PathParam("id") long id) {
        Long callerId = currentUserResolver.currentUserIdIfAuthenticated().orElse(null);
        return mediaRepository.findVisibleMedia(id, callerId)
                .flatMap(mediaRepository::resolveStoredImage)
                .map(image -> Response.ok(image.path().toFile(), image.type().mediaType())
                        .header("X-Content-Type-Options", "nosniff")
                        .header("Cache-Control", "private, max-age=300")
                        .build())
                .orElseGet(() -> Response.status(Response.Status.NOT_FOUND).build());
    }

    /**
     * Deletes a gallery item and its stored image. Only the uploader or the party host may delete;
     * other viewers get 403, callers who cannot view the party get 404.
     */
    @DELETE
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    @Authenticated
    public Response deleteMedia(@PathParam("id") long id) {
        Long callerId = currentUserResolver.requireCurrentUserId();
        return mediaRepository.delete(id, callerId);
    }
}
