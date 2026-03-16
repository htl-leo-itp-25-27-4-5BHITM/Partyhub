package at.htl;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;

@ApplicationScoped
public class DataSeeder {
    void onStart(@Observes StartupEvent ev) {
        // disabled - data is seeded via import.sql
    }
}
