INSERT INTO location (id, longitude, latitude) VALUES
                                                   (1, 15.42, 48.21),
                                                   (2, 16.37, 48.20),
                                                   (3, 14.29, 48.30),
                                                   (4, 13.04, 47.80),
(5, 14.04, 48.80);
ALTER SEQUENCE location_id_seq RESTART WITH 6;

INSERT INTO users (name, email, profile_picture) VALUES
                                           ('Alice Johnson', 'alice.johnson@example.com', 'profile_picture1.jpg'),
                                           ('Bob Smith', 'bob.smith@example.com', 'profile_picture2.jpg'),
                                           ('Charlie Brown', 'charlie.brown@example.com', 'profile_picture3.jpg'),
                                           ('Daisy Miller', 'daisy.miller@example.com', 'profile_picture4.jpg' ),
                                           ('Eve Davis', 'eve.davis@example.com', 'profile_picture5.jpg' );

INSERT INTO category (name) VALUES
                                         ('Birthday Party'),
                                         ('Wedding'),
                                         ('Corporate Event'),
                                         ('Music Festival'),
                                         ('Art Exhibition');



INSERT INTO party (
    host_user_id,
    category_id,
    title,
    time_start,
    time_end,
    max_people,
    min_age,
    max_age,
    description,
    location_id,
    created_at,
    fee
) VALUES
-- 1️⃣ Weekend game night
( 1, 5, 'Saturday Game Night',
 '07.12.2025 19:00', '07.12.2025 23:00',
 12, 21, 35,
 'Board games, snacks, and a relaxed vibe. Bring your favorite game!',
 1,
 '2025-10-01 08:15:00',0),

-- 2️⃣ Sunrise mountain hike
( 2, 3, 'Mountain Hike – Sunrise',
 '07.12.2025 05:30', '07.12.2025 10:30',
 8, 18, 45,
 'Meet at the trailhead for a sunrise hike up Eagle Peak. Moderate difficulty.',
 2,
 '2025-10-02 12:40:00',0),

-- 3️⃣ Intro to Python workshop
( 3, 2, 'Intro to Python Coding',
 '07.12.2025 14:00', '07.12.2025 17:00',
 20, 16, 60,
 'Hands‑on Python basics. No prior experience required. Laptops provided.',
 3,
 '2025-10-03 09:05:00',0),

-- 4️⃣ Italian dinner party
( 4, 1, 'Italian Dinner Party',
 '07.12.2025 19:30', '07.12.2025 22:30',
 6, 25, 50,
 'Homemade pasta, wine, and good conversation. RSVP by Dec15.',
 4,
 '2025-10-04 14:22:00',0),

-- 5️⃣ Kids craft afternoon
( 5, 4, 'Kids Craft Afternoon',
 '07.12.2025 13:00', '07.12.2025 15:00',
 10, 5, 12,
 'Paint, glue, and glitter! All materials supplied. Parents welcome.',
 5,
 '2025-10-05 16:30:00',0);
INSERT INTO friendship_status (id, name) VALUES
                                                           (1,  'following'),
                                                           (2,  'pending'),
                                                           (3,  'blocked');
INSERT INTO friendship (user1_id, user2_id, status_id) VALUES
                                                        (1, 2, 1),
                                                        (2, 3, 2),
                                                        (1, 3, 3),
                                                        (4, 5, 1);
INSERT INTO media (party_id, user_id, url) VALUES
                                                     (1, 1, 'http://example.com/images/party1.jpg'),
                                                     (2, 2, 'http://example.com/images/party2.jpg'),
                                                     (3, 3, 'http://example.com/images/party3.jpg'),
                                                     (4, 4, 'http://example.com/images/party4.jpg'),
                                                     (5, 5, 'http://example.com/images/party5.jpg');
INSERT INTO invitation(party_id, recipient_id, sender_id) VALUES (1, 2, 1),
                                                                 (2, 1, 2);