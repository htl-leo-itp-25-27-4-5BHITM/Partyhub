package at.htl.security;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.LinkedHashMap;
import java.util.Map;

/** A rejected e-mail change step with a stable {@code code} the browser maps to a message. */
public class EmailChangeProblem extends WebApplicationException {

    public EmailChangeProblem(Response.Status status, String code, String message) {
        this(status, code, message, null);
    }

    public EmailChangeProblem(Response.Status status, String code, String message, String field) {
        super(message, Response.status(status).type(MediaType.APPLICATION_JSON).entity(body(code, message, field)).build());
    }

    private static Map<String, String> body(String code, String message, String field) {
        Map<String, String> body = new LinkedHashMap<>();
        body.put("code", code);
        body.put("message", message);
        if (field != null) {
            body.put("field", field);
        }
        return body;
    }
}
