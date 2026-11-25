package at.htl.validation;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.quarkus.hibernate.validator.runtime.jaxrs.ResteasyReactiveViolationException;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.server.ServerExceptionMapper;
import java.util.Map;

/** Do not include rejected values, property paths, SQL, or parser exception details. */
@jakarta.annotation.Priority(1)
public class InputExceptionMappers {
    public static Response invalid() {
        return Response.status(400).type(MediaType.APPLICATION_JSON_TYPE)
                .entity(Map.of("error", "invalid_input", "message", "Request fields are missing or invalid")).build();
    }

    @ServerExceptionMapper({
        ResteasyReactiveViolationException.class,
        com.fasterxml.jackson.databind.exc.MismatchedInputException.class,
        com.fasterxml.jackson.core.JsonParseException.class,
        JsonProcessingException.class,
        BadRequestException.class
    })
    public Response invalidRequest() { return invalid(); }
}
