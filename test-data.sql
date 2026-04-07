-- Clean test data for PartyHub - run directly in PostgreSQL

-- Users (matching Keycloak users alice, bob, carol)
INSERT INTO users (id,  username, display_name, distinct_name, email, biography) VALUES
(1,  'alice', 'Alice Smith', 'alice', 'alice@example.com', 'Party enthusiast and event organizer'),
(2,  'bob', 'Bob Johnson', 'bob', 'bob@example.com', 'Music lover and social butterfly'),
(3,  'carol', 'Carol Williams', 'carol', 'carol@example.com', 'Adventure seeker and networking expert'),
(4,  'dave', 'Dave Miller', 'dave', 'dave@example.com', 'Tech geek and party planner'),
(5,  'eve', 'Eve Davis', 'eve', 'eve@example.com', 'Art lover and creative soul');

-- Follow status
INSERT INTO follow_status (id, name) VALUES
(1, 'ausstehend'),
(2, 'akzeptiert'),
(3, 'blockiert');

-- Categories
INSERT INTO category (id, name) VALUES
(1, 'Musik'),
(2, 'Technologie'),
(3, 'Sport'),
(4, 'Kunst'),
(5, 'Networking'),
(6, 'Essen & Trinken');

-- Locations
INSERT INTO location (id, longitude, latitude) VALUES
(1, 14.2858, 48.3069),
(2, 14.2900, 48.3050),
(3, 14.2950, 48.3000),
(4, 14.2800, 48.3100),
(5, 14.3000, 48.3080);

-- User locations
INSERT INTO user_location (user_id, longitude, latitude) VALUES
(1, 14.2858, 48.3069),
(2, 14.2900, 48.3050),
(3, 14.2950, 48.3000),
(4, 14.2800, 48.3100),
(5, 14.3000, 48.3080);

-- Parties
INSERT INTO party (id, host_user_id, category_id, location_id, title, time_start, time_end, max_people, min_age, max_age, website, description, fee, created_at) VALUES
(1, 1, 1, 1, 'Weekend Techno Party', '2026-04-12 22:00:00', '2026-04-13 04:00:00', 150, 18, 35, 'https://example.at', 'Best techno in town!', 10.00, NOW()),
(2, 2, 5, 2, 'Networking Night', '2026-04-13 19:00:00', '2026-04-13 23:00:00', 80, 18, 50, 'https://example.at', 'Meet new people!', 0.00, NOW()),
(3, 3, 4, 3, 'Art Exhibition Opening', '2026-04-14 18:00:00', '2026-04-14 22:00:00', 100, 16, 60, 'https://example.at', 'Modern art showcase', 5.00, NOW()),
(4, 4, 1, 4, 'Open Mic Night', '2026-04-15 20:00:00', '2026-04-16 00:00:00', 60, 16, 99, 'https://example.at', 'Show your talent!', 0.00, NOW()),
(5, 5, 6, 5, 'Wine Tasting Evening', '2026-04-16 19:00:00', '2026-04-16 23:00:00', 40, 18, 60, 'https://example.at', 'Premium wines & cheese', 25.00, NOW());

-- Party users (attendees)
INSERT INTO party_user (party_id, user_id) VALUES
(1, 1), (1, 2), (1, 3),
(2, 2), (2, 4),
(3, 1), (3, 3), (3, 5),
(4, 4), (4, 5),
(5, 1), (5, 2), (5, 3);

-- Media
INSERT INTO media (id, party_id, user_id, file) VALUES
(1, 1, 1, 'party1.jpg'),
(2, 2, 2, 'party2.jpg'),
(3, 3, 3, 'party3.jpg');

-- Invitations
INSERT INTO invitation (id, sender_id, recipient_id, party_id) VALUES
(1, 1, 2, 1),
(2, 2, 3, 2),
(3, 3, 4, 3),
(4, 4, 5, 4);

-- Follows (friendships)
INSERT INTO follow (user1_id, user2_id, status_id) VALUES
(1, 2, 2),
(1, 3, 2),
(2, 1, 2),
(3, 1, 2),
(4, 2, 2),
(5, 1, 1);
