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
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;

@ApplicationScoped
@Path("/api/media")
public class MediaResource {

    @Inject
    MediaRepository mediaRepository;

    @GET
    @Path("/{party}")
    public List<Media> getImages(@PathParam("party") long partyId) {
        return mediaRepository.getImages(partyId);
    }

    @POST
    @Path("/upload/{partyId}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response upload(MediaRepository.FileUploadInput input, @PathParam("partyId") long partyId) throws IOException {
        return mediaRepository.upload(input, partyId);
    }

}
