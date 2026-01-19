package at.htl.media;

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
    @GET
    @Path("/{id}")
    @Produces({"image/jpeg", "image/png", "image/gif"})
    public Response getImgByMediaId(@PathParam("id") long id) {
        return mediaRepository.getImgByMediaId(id);
    }
}
