package at.htl.validation;

import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Map;

/** Bound JSON input before Jackson parsing, including streamed/chunked requests. */
@Provider
@Priority(Priorities.ENTITY_CODER - 100)
public class JsonBodyLimitFilter implements ContainerRequestFilter {
    public static final int MAX_JSON_BYTES = 256 * 1024;
    @Override
    public void filter(ContainerRequestContext request) throws IOException {
        if (request.getMediaType() == null || !(request.getMediaType().isCompatible(MediaType.APPLICATION_JSON_TYPE)
                || request.getMediaType().getSubtype().endsWith("+json"))) return;
        byte[] bytes = request.getEntityStream().readNBytes(MAX_JSON_BYTES + 1);
        if (bytes.length > MAX_JSON_BYTES) {
            request.abortWith(Response.status(413).type(MediaType.APPLICATION_JSON_TYPE)
                    .entity(Map.of("error", "request_too_large", "message", "JSON body exceeds 256 KiB")).build());
            return;
        }
        request.setEntityStream(new ByteArrayInputStream(bytes));
    }
}
