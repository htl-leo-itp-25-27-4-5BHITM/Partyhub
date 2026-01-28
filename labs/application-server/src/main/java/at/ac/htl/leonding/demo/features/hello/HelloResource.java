package at.ac.htl.leonding.demo.features.hello;

import java.time.LocalDateTime;

import jakarta.annotation.security.PermitAll;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;

@Path("/hello")
@PermitAll
public class HelloResource {
    @GET
    public Hello hello() {
        return new Hello("hello, world", LocalDateTime.now());
    } 
}
