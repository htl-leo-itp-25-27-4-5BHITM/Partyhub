package at.htl.model;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

@ApplicationScoped
@Path("/")
public class FileUploadResource {

    @Inject
    Logger logger;

    @POST
    @Path("upload/")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Response upload(FileUploadInput input) throws IOException {
        logger.log(Logger.Level.DEBUG, "upload");
        String uploadDir = "src/main/resources/uploads";
        Files.createDirectories(Paths.get(uploadDir));
        for (FileUpload file : input.file) {
            java.nio.file.Path uploadedFile = file.uploadedFile();
            java.nio.file.Path targetLocation = Paths.get(uploadDir, file.fileName());
            Files.move(uploadedFile, targetLocation);
            logger.log(Logger.Level.INFO, "File saved to: " + targetLocation);
        }
        return Response.ok().build();
    }
    public static class FileUploadInput {

        @FormParam("text")
        public String text;

        @FormParam("file")
        public List<FileUpload> file;

    }
}