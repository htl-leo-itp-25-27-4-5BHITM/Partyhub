package at.htl.media;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

@ApplicationScoped
@Path("/api/media")
public class MediaResource {
    @Inject
    MediaRepository mediaRepository;
    @GET
    @Path("/{id}")
    @Produces({"image/jpeg", "image/png", "image/gif" })
    public Response getMediaById(@PathParam("id") long id) {
        return mediaRepository.getMediaById(id);
    }

    @Inject
    Logger logger;
    @GET
    @Path("/user/{id}/all")
    public Response getMediaByUser(@PathParam("id") long userId) {
        logger.info(String.format("Getting media by user %d", userId));
        return Response.ok().entity(mediaRepository.getMediaByUser(userId)).build();
    }

    @GET
    @Path("/party/{id}/all")
    public Response getMediaByParty(@PathParam("id") long partyId) {
        return Response.ok().entity(mediaRepository.getMediaByParty(partyId)).build();
    }
}
