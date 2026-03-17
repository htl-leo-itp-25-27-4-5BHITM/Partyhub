package at.htl;

import at.htl.user.User;
import at.htl.user.UserRepository;
import at.htl.user_location.UserLocation;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class DataSeeder {

    @Inject
    UserRepository userRepository;

    @Inject
    jakarta.persistence.EntityManager em;

    @Transactional
    void onStart(@Observes StartupEvent ev) {
        List<User> users = userRepository.getUsers();
        
        if (!users.isEmpty()) {
            double[][] testLocations = {
                {48.2082, 16.3738},
                {48.2099, 16.3567},
                {48.1985, 16.3839},
                {48.2200, 16.3500},
                {48.2150, 16.3900},
                {48.2050, 16.3600}
            };

            for (int i = 0; i < Math.min(users.size(), testLocations.length); i++) {
                UserLocation location = new UserLocation();
                location.setUser(users.get(i));
                location.setLatitude(testLocations[i][0]);
                location.setLongitude(testLocations[i][1]);
                
                UserLocation existing = em.find(UserLocation.class, users.get(i).getId());
                if (existing == null) {
                    em.persist(location);
                }
            }
        }
    }
}
