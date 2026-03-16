package at.htl;

import at.htl.category.Category;
import at.htl.follow.Follow;
import at.htl.follow.FollowStatus;
import at.htl.invitation.Invitation;
import at.htl.location.Location;
import at.htl.media.Media;
import at.htl.party.Party;
import at.htl.profile_picture.ProfilePicture;
import at.htl.user.User;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@ApplicationScoped
public class DataSeeder {

    @Inject
    EntityManager em;

    @Transactional
    void onStart(@Observes StartupEvent ev) {
        if (isDataSeeded()) {
            return;
        }

        seedFollowStatus();
        seedCategories();
        seedLocations();
        seedUsers();
        seedParties();
        seedMedia();
        seedInvitations();
        seedFollows();
    }

    private boolean isDataSeeded() {
        Long count = em.createQuery("SELECT COUNT(c) FROM Category c", Long.class).getSingleResult();
        return count > 0;
    }

    private void seedFollowStatus() {
        FollowStatus following = new FollowStatus();
        following.setStatus_id(1L);
        following.setName("following");
        em.persist(following);

        FollowStatus blocked = new FollowStatus();
        blocked.setStatus_id(2L);
        blocked.setName("blocked");
        em.persist(blocked);

        em.flush();
    }

    private void seedCategories() {
        String[] categoryNames = {"Birthday", "Concert", "Club", "House Party", "Festival", "Barbecue"};
        for (String name : categoryNames) {
            Category category = new Category();
            category.setName(name);
            em.persist(category);
        }
        em.flush();
    }

    private void seedLocations() {
        Object[][] locationData = {
                {"Hauptplatz 1, 1010 Wien", 48.2082, 16.3738},
                {"Mariahilfer Str. 100, 1060 Wien", 48.2000, 16.3500},
                {"Schlosserstraße 15, 4020 Linz", 48.3064, 14.2858},
                {"Sonnenstraße 20, 8010 Graz", 47.0707, 15.4395},
                {"Mozartstraße 5, 5020 Salzburg", 47.8095, 13.0550}
        };

        for (Object[] data : locationData) {
            Location location = new Location();
            location.setAddress((String) data[0]);
            location.setLatitude((Double) data[1]);
            location.setLongitude((Double) data[2]);
            em.persist(location);
        }
        em.flush();
    }

    private void seedUsers() {
        Object[][] userData = {
                {"Max Müller", "max.mueller", "max@example.com", "Party enthusiast and music lover"},
                {"Anna Schmidt", "anna.schmidt", "anna@example.com", "Always looking for the best events"},
                {"Lukas Weber", "lukas.weber", "lukas@example.com", "DJ and event organizer"},
                {"Sophie Fischer", "sophie.fischer", "sophie@example.com", "Love dancing and good vibes"},
                {"Tom Wagner", "tom.wagner", "tom@example.com", "Social butterfly"}
        };

        String[] profilePics = {"max_avatar.jpg", "anna_avatar.jpg", "lukas_avatar.jpg", "sophie_avatar.jpg", "tom_avatar.jpg"};

        for (int i = 0; i < userData.length; i++) {
            User user = new User();
            user.setDisplayName((String) userData[i][0]);
            user.setDistinctName((String) userData[i][1]);
            user.setEmail((String) userData[i][2]);
            user.setBiography((String) userData[i][3]);
            em.persist(user);
            em.flush();

            ProfilePicture profilePicture = new ProfilePicture(profilePics[i], user);
            user.setProfilePicture(profilePicture);
            em.persist(profilePicture);
        }
        em.flush();
    }

    private void seedParties() {
        List<Category> categories = em.createQuery("SELECT c FROM Category c", Category.class).getResultList();
        List<User> users = em.createQuery("SELECT u FROM User u", User.class).getResultList();
        List<Location> locations = em.createQuery("SELECT l FROM Location l", Location.class).getResultList();

        Object[][] partyData = {
                {users.get(0), categories.get(3), "Summer Rooftop Party", LocalDateTime.of(2026, 3, 15, 18, 0), LocalDateTime.of(2026, 3, 15, 23, 0), 50, 18, 35, "https://example.com/party1", "Join us for an amazing rooftop party with great music and drinks!", 10.00, locations.get(0)},
                {users.get(2), categories.get(2), "Techno Night", LocalDateTime.of(2026, 3, 20, 22, 0), LocalDateTime.of(2026, 3, 21, 4, 0), 200, 16, 50, "https://example.com/party2", "Epic techno night with local DJs", 15.00, locations.get(1)},
                {users.get(1), categories.get(0), "Birthday Bash", LocalDateTime.of(2026, 3, 25, 19, 0), LocalDateTime.of(2026, 3, 25, 23, 30), 30, 0, 99, null, "Celebrating my birthday with friends!", 0.00, locations.get(2)},
                {users.get(3), categories.get(4), "Music Festival 2026", LocalDateTime.of(2026, 4, 10, 14, 0), LocalDateTime.of(2026, 4, 12, 23, 0), 500, 16, 60, "https://example.com/festival", "Three days of amazing music!", 50.00, locations.get(3)},
                {users.get(4), categories.get(5), "Spring Barbecue", LocalDateTime.of(2026, 4, 5, 12, 0), LocalDateTime.of(2026, 4, 5, 18, 0), 25, 0, 99, null, "Casual barbecue in the park", 5.00, locations.get(4)}
        };

        for (Object[] data : partyData) {
            Party party = new Party();
            party.setHost_user((User) data[0]);
            party.setCategory((Category) data[1]);
            party.setTitle((String) data[2]);
            party.setTime_start((LocalDateTime) data[3]);
            party.setTime_end((LocalDateTime) data[4]);
            party.setMax_people((Integer) data[5]);
            party.setMin_age((Integer) data[6]);
            party.setMax_age((Integer) data[7]);
            party.setWebsite((String) data[8]);
            party.setDescription((String) data[9]);
            party.setFee((Double) data[10]);
            party.setLocation((Location) data[11]);
            em.persist(party);
        }
        em.flush();

        seedPartyUsers();
    }

    private void seedPartyUsers() {
        List<Party> parties = em.createQuery("SELECT p FROM Party p", Party.class).getResultList();
        List<User> users = em.createQuery("SELECT u FROM User u", User.class).getResultList();

        Set<User> party1Users = new HashSet<>();
        party1Users.add(users.get(0));
        party1Users.add(users.get(1));
        party1Users.add(users.get(3));
        parties.get(0).setUsers(party1Users);

        Set<User> party2Users = new HashSet<>();
        party2Users.add(users.get(2));
        party2Users.add(users.get(0));
        party2Users.add(users.get(4));
        parties.get(1).setUsers(party2Users);

        Set<User> party3Users = new HashSet<>();
        party3Users.add(users.get(1));
        party3Users.add(users.get(0));
        parties.get(2).setUsers(party3Users);

        Set<User> party4Users = new HashSet<>();
        party4Users.add(users.get(3));
        party4Users.add(users.get(0));
        party4Users.add(users.get(1));
        party4Users.add(users.get(2));
        parties.get(3).setUsers(party4Users);

        Set<User> party5Users = new HashSet<>();
        party5Users.add(users.get(4));
        party5Users.add(users.get(1));
        parties.get(4).setUsers(party5Users);

        for (Party party : parties) {
            em.merge(party);
        }
        em.flush();
    }

    private void seedMedia() {
        List<Party> parties = em.createQuery("SELECT p FROM Party p", Party.class).getResultList();
        List<User> users = em.createQuery("SELECT u FROM User u", User.class).getResultList();

        Object[][] mediaData = {
                {parties.get(0), users.get(0), "party1/rooftop1.jpg"},
                {parties.get(0), users.get(1), "party1/rooftop2.jpg"},
                {parties.get(1), users.get(2), "party2/techno1.jpg"},
                {parties.get(1), users.get(4), "party2/techno2.jpg"},
                {parties.get(2), users.get(1), "party3/birthday1.jpg"},
                {parties.get(3), users.get(3), "party4/festival1.jpg"},
                {parties.get(4), users.get(4), "party5/bbq1.jpg"}
        };

        for (Object[] data : mediaData) {
            Media media = new Media((Party) data[0], (User) data[1], (String) data[2]);
            em.persist(media);
        }
        em.flush();
    }

    private void seedInvitations() {
        List<Party> parties = em.createQuery("SELECT p FROM Party p", Party.class).getResultList();
        List<User> users = em.createQuery("SELECT u FROM User u", User.class).getResultList();

        Object[][] invitationData = {
                {users.get(0), users.get(2), parties.get(0)},
                {users.get(1), users.get(3), parties.get(0)},
                {users.get(2), users.get(0), parties.get(1)},
                {users.get(3), users.get(1), parties.get(3)},
                {users.get(4), users.get(2), parties.get(4)}
        };

        for (Object[] data : invitationData) {
            Invitation invitation = new Invitation();
            invitation.setSender((User) data[0]);
            invitation.setRecipient((User) data[1]);
            invitation.setParty((Party) data[2]);
            em.persist(invitation);
        }
        em.flush();
    }

    private void seedFollows() {
        List<User> users = em.createQuery("SELECT u FROM User u", User.class).getResultList();
        FollowStatus followingStatus = em.find(FollowStatus.class, 1L);

        Object[][] followData = {
                {users.get(0), users.get(1)},
                {users.get(0), users.get(2)},
                {users.get(1), users.get(0)},
                {users.get(1), users.get(3)},
                {users.get(2), users.get(0)},
                {users.get(3), users.get(1)},
                {users.get(4), users.get(0)}
        };

        for (Object[] data : followData) {
            Follow follow = new Follow();
            follow.setUser1_id(((User) data[0]).getId());
            follow.setUser2_id(((User) data[1]).getId());
            follow.setStatus(followingStatus);
            em.persist(follow);
        }
        em.flush();
    }
}
