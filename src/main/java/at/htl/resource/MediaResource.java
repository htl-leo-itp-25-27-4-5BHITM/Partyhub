package at.htl.resource;

import at.htl.model.Media;
import at.htl.model.User;
import at.htl.repository.MediaRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.io.IOException;
import java.util.List;

@ApplicationScoped
@Path("/api/media")
public class MediaResource {

    @Inject
    MediaRepository mediaRepository;

    @GET
    @Path("/{party}")
    @Produces(MediaType.APPLICATION_JSON)
    public List<Media> getImages(@PathParam("party") long partyId) {
        return mediaRepository.getImages(partyId);
    }

    @POST
    @Path("/{partyId}/upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response upload(MediaRepository.FileUploadInput input, @PathParam("partyId") long partyId) throws IOException {
        return mediaRepository.upload(input, partyId);
    }

}
