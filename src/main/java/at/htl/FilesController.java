package at.htl;

import io.quarkus.qute.Location;
import io.quarkus.qute.Template;
import io.quarkus.qute.TemplateInstance;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

@ApplicationScoped
@Produces(MediaType.TEXT_HTML)
@Path("files.html")
public class FilesController {

    @Location("files.html")
    Template template;

    @GET
    public TemplateInstance get() {
        return template.instance();
    }

//    @POST
//    @Consumes(MediaType.MULTIPART_FORM_DATA)
//    public TemplateInstance upload(@MultipartForm MultipartFormDataInput input) throws IOException {
//
//        System.out.println(">>>");
//
//        System.out.println("text = " + input.getFormDataPart("text", new GenericType<String>() {}));
//
//        for (InputPart part : input.getParts()) {
//            System.out.println("part.getHeaders() = " + part.getHeaders());
//            System.out.println("part.getFileName() = " + part.getFileName());
//            System.out.println("part.getBody() = " + new String(part.getBody().readAllBytes()));
//            System.out.println("---");
//        }
//        System.out.println("<<<");
//
//        return template.instance();
//    }

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public TemplateInstance upload(FileUploadInput input) throws IOException {

        System.out.println(">>>");

        System.out.println("input.text = " + input.text);

        String uploadDir = "src/main/resources/uploads"; // Specify your upload directory here
        Files.createDirectories(Paths.get(uploadDir)); // Create the directory if it doesn't exist

        for (FileUpload file : input.file) {
            // Get the uploaded file
            java.nio.file.Path uploadedFile = file.uploadedFile();
            // Define the target location
            java.nio.file.Path targetLocation = Paths.get(uploadDir, file.fileName());

            // Move or copy the file to the target location
            Files.move(uploadedFile, targetLocation);

            System.out.println("File saved to: " + targetLocation);
        }

        System.out.println("<<<");

        return template.instance();
    }

    public static class FileUploadInput {

        @FormParam("text")
        public String text;

        @FormParam("file")
        public List<FileUpload> file;

    }

}