-- =============================================================================
-- 1. USERS (Müssen zuerst existieren für host_user_id)
-- =============================================================================
INSERT INTO users (id, name, email, profile_picture, biography)
VALUES
    (1, 'Lukas', 'lukas@htl.at', 'profile_picture1.jpg', 'Gamer & Coder'),
    (2, 'Anna', 'anna@htl.at', 'profile_picture2.jpg', 'Wanderlust'),
    (3, 'Max', 'max@htl.at', 'profile_picture5.jpg', 'Hands-on Python basics.'),
    (4, 'Carla', 'carla@htl.at', 'profile_picture3.jpg', 'Italian cuisine lover.'),
    (5, 'Julia', 'julia@htl.at', 'profile_picture4.jpg', 'Kids Craft expert.')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. CATEGORY
-- =============================================================================
INSERT INTO category (id, name)
VALUES
    (1, 'Dinner'),
    (2, 'Coding'),
    (3, 'Hike'),
    (4, 'Kids'),
    (5, 'Games')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. LOCATION (latitude, longitude, id)
-- =============================================================================
INSERT INTO location (id, latitude, longitude)
VALUES
    (1, 48.2685, 14.2518),
    (2, 48.3069, 14.2858),
    (3, 48.3060, 14.2861),
    (4, 48.3001, 14.2900),
    (5, 48.2950, 14.3000)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 4. PARTY (ISO-Format für Timestamps: YYYY-MM-DD HH:MM:SS)
-- =============================================================================
INSERT INTO party (id, host_user_id, category_id, location_id, title, description, time_start, time_end, created_at, max_people, min_age, max_age, fee)
VALUES
    (1, 1, 5, 1, 'Saturday Game Night', 'Board games, snacks, and a relaxed vibe.', '2025-12-07 19:00:00', '2025-12-07 23:00:00', '2025-10-01 08:15:00', 12, 21, 35, 0),
    (2, 2, 3, 2, 'Mountain Hike – Sunrise', 'Sunrise hike up Eagle Peak. Moderate difficulty.', '2025-12-07 05:30:00', '2025-12-07 10:30:00', '2025-10-02 12:40:00', 8, 18, 45, 0),
    (3, 3, 2, 3, 'Intro to Python Coding', 'Hands‑on Python basics. Laptops provided.', '2025-12-07 14:00:00', '2025-12-07 17:00:00', '2025-10-03 09:05:00', 20, 16, 60, 0),
    (4, 4, 1, 4, 'Italian Dinner Party', 'Homemade pasta, wine, and good conversation.', '2025-12-07 19:30:00', '2025-12-07 22:30:00', '2025-10-04 14:22:00', 6, 25, 50, 0),
    (5, 5, 4, 5, 'Kids Craft Afternoon', 'Paint, glue, and glitter! Parents welcome.', '2025-12-07 13:00:00', '2025-12-07 15:00:00', '2025-10-05 16:30:00', 10, 5, 12, 0)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 5. MEDIA
-- =============================================================================
INSERT INTO media (id, party_id, user_id, url)
VALUES
    (1, 1, 1, 'http://example.com/images/party1.jpg'),
    (2, 2, 2, 'http://example.com/images/party2.jpg')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 6. SEQUENZEN SYNCHRONISIEREN (Ganz wichtig für Postgres!)
-- Damit neue IDs über die Website nach den manuellen IDs (1, 2, 3...) starten.
-- =============================================================================
SELECT setval(pg_get_serial_sequence('users', 'id'), coalesce(max(id), 1)) FROM users;
SELECT setval(pg_get_serial_sequence('location', 'id'), coalesce(max(id), 1)) FROM location;
SELECT setval(pg_get_serial_sequence('party', 'id'), coalesce(max(id), 1)) FROM party;
SELECT setval(pg_get_serial_sequence('category', 'id'), coalesce(max(id), 1)) FROM category;
SELECT setval(pg_get_serial_sequence('media', 'id'), coalesce(max(id), 1)) FROM media;