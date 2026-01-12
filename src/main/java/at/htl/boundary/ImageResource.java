package at.htl.boundary;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Response;
import java.io.InputStream;

@Path("/images")
public class ImageResource {

    @GET
    @Path("/{filename}")
    @Produces("image/jpeg")
    public Response getImage(@PathParam("filename") String filename) {
        // WICHTIG: Holt die Datei aus src/main/resources/images/
        InputStream is = Thread.currentThread().getContextClassLoader()
                .getResourceAsStream("images/" + filename);

        if (is == null) {
            // Fallback, falls Datei nicht existiert
            is = Thread.currentThread().getContextClassLoader()
                    .getResourceAsStream("images/profile_picture1.jpg");
        }

        if (is == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        return Response.ok(is).build();
    }
}