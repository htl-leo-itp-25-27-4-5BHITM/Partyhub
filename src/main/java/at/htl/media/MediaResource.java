package at.htl.media;

import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
@Path("/api/media")
public class MediaResource {

    @Inject
    MediaRepository mediaRepository;

    @Inject
    Logger logger;

    @GET
    @Path("/{id}")
    @Produces({"image/jpeg", "image/png", "image/gif", "image/webp"})
    public Response getMediaById(@PathParam("id") long id) {
        return mediaRepository.getImgByMediaId(id);
    }

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