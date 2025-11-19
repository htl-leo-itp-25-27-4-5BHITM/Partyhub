INSERT INTO user_account (name, email) VALUES
                                           ('Alice Johnson', 'alice.johnson@example.com'),
                                           ('Bob Smith', 'bob.smith@example.com'),
                                           ('Charlie Brown', 'charlie.brown@example.com'),
                                           ('Daisy Miller', 'daisy.miller@example.com'),
                                           ('Eve Davis', 'eve.davis@example.com');

INSERT INTO category (category_name) VALUES
                                         ('Birthday Party'),
                                         ('Wedding'),
                                         ('Corporate Event'),
                                         ('Music Festival'),
                                         ('Art Exhibition');


INSERT INTO  party_attendees (party_id, user_id) VALUES
                                                    (1, 2),
                                                    (1, 3),
                                                    (2, 1),
                                                    (3, 4),
                                                    (4, 1),
                                                    (5, 3);


INSERT INTO party (
    party_id,
    host_user_id,
    category_id,
    title,
    time_start,
    time_end,
    max_people,
    min_age,
    max_age,
    description,
    latitude,
    longitude,
    created_at
) VALUES
-- 1️⃣ Weekend game night
(1, 101, 5, 'Saturday Game Night',
 '2025-12-07 19:00:00', '2025-12-07 23:00:00',
 12, 21, 35,
 'Board games, snacks, and a relaxed vibe. Bring your favorite game!',
 40.712776, -74.005974,
 '2025-10-01 08:15:00'),

-- 2️⃣ Sunrise mountain hike
(2, 202, 3, 'Mountain Hike – Sunrise',
 '2025-11-30 05:30:00', '2025-11-30 10:30:00',
 8, 18, 45,
 'Meet at the trailhead for a sunrise hike up Eagle Peak. Moderate difficulty.',
 34.052235, -118.243683,
 '2025-10-02 12:40:00'),

-- 3️⃣ Intro to Python workshop
(3, 303, 2, 'Intro to Python Coding',
 '2025-12-15 14:00:00', '2025-12-15 17:00:00',
 20, 16, 60,
 'Hands‑on Python basics. No prior experience required. Laptops provided.',
 51.507351, -0.127758,
 '2025-10-03 09:05:00'),

-- 4️⃣ Italian dinner party
(4, 404, 1, 'Italian Dinner Party',
 '2025-12-20 19:30:00', '2025-12-20 22:30:00',
 6, 25, 50,
 'Homemade pasta, wine, and good conversation. RSVP by Dec15.',
 48.856613, 2.352222,
 '2025-10-04 14:22:00'),

-- 5️⃣ Kids craft afternoon
(5, 505, 4, 'Kids Craft Afternoon',
 '2025-12-05 13:00:00', '2025-12-05 15:00:00',
 10, 5, 12,
 'Paint, glue, and glitter! All materials supplied. Parents welcome.',
 41.878113, -87.629799,
 '2025-10-05 16:30:00');


INSERT INTO party_media (party_id, user_id, url) VALUES
                                                     (1, 1, 'http://example.com/images/party1.jpg'),
                                                     (2, 2, 'http://example.com/images/party2.jpg'),
                                                     (3, 3, 'http://example.com/images/party3.jpg'),
                                                     (4, 4, 'http://example.com/images/party4.jpg'),
                                                     (5, 5, 'http://example.com/images/party5.jpg');

INSERT INTO friendship_status (status_id, status_name) VALUES
                                                           (1,  'friends'),
                                                           (2,  'pending'),
                                                           (3,  'blocked');
INSERT INTO friendship (user1_id, user2_id, status_id) VALUES
                                                        (1, 2, 1),
                                                        (2, 3, 2),
                                                        (1, 3, 3),
                                                        (4, 5, 1);
