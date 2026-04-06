-- =========================
-- RESET (optional)
-- =========================
TRUNCATE TABLE follow, invitation, media, party_user, party, user_location, users, location, category, follow_status RESTART IDENTITY CASCADE;

-- =========================
-- FRIENDSHIP_STATUS
-- =========================
INSERT INTO follow_status (id, name) VALUES
                                         (1, 'ausstehend'),
                                         (2, 'akzeptiert'),
                                         (3, 'blockiert');

-- =========================
-- USERS
-- =========================
INSERT INTO users (id, keycloak_id, username, display_name, distinct_name, email, biography) VALUES
                                                                           (1,  'keycloak-user-1', 'anna_huber',       'Anna Huber',       'anna_huber',       'anna.huber@linz.at',       'Event-Liebhaberin aus Linz.'),
                                                                           (2,  'keycloak-user-2', 'michael_wagner',   'Michael Wagner',   'michael_wagner',   'michael.wagner@linz.at',   'Tech, Musik und neue Leute kennenlernen.'),
                                                                           (3,  'keycloak-user-3', 'katrin_bauer',     'Katrin Bauer',     'katrin_bauer',     'katrin.bauer@linz.at',     'Tanzen, Konzerte, gute Stimmung.'),
                                                                           (4,  'keycloak-user-4', 'thomas_schneider', 'Thomas Schneider', 'thomas_schneider', 'thomas.schneider@linz.at', 'Organisiert gerne Veranstaltungen.'),
                                                                           (5,  'keycloak-user-5', 'sabine_weber',     'Sabine Weber',     'sabine_weber',     'sabine.weber@linz.at',     'Networking & Kultur.'),
                                                                           (6,  'keycloak-user-6', 'lukas_gruber',     'Lukas Gruber',     'lukas_gruber',     'lukas.gruber@linz.at',     'Sport & Outdoor – aber auch Partys!'),
                                                                           (7,  'keycloak-user-7', 'mia_steiner',      'Mia Steiner',      'mia_steiner',      'mia.steiner@linz.at',      'Kunst, Food, Afterwork.'),
                                                                           (8,  'keycloak-user-8', 'david_koenig',     'David König',      'david_koenig',     'david.koenig@linz.at',     'Meetups, Startups, Tech.'),
                                                                           (9,  'keycloak-user-9', 'nina_fischer',     'Nina Fischer',     'nina_fischer',     'nina.fischer@linz.at',     'Yoga, Wellness, entspannte Events.'),
                                                                           (10, 'keycloak-user-10', 'elias_berger',     'Elias Berger',     'elias_berger',     'elias.berger@linz.at',     'Fotos, Musik, kleine Gigs.');

-- =========================
-- USER_LOCATION (Linz)
-- =========================
INSERT INTO user_location (user_id, longitude, latitude) VALUES
                                                             (1, 14.2858, 48.3069),
                                                             (2, 14.2900, 48.3050),
                                                             (3, 14.2950, 48.3000),
                                                             (4, 14.2800, 48.3100),
                                                             (5, 14.3000, 48.3080),
                                                             (6, 14.2750, 48.3040);

-- =========================
-- CATEGORY
-- =========================
INSERT INTO category (id, name) VALUES
                                    (1, 'Musik'),
                                    (2, 'Technologie'),
                                    (3, 'Sport'),
                                    (4, 'Kunst'),
                                    (5, 'Networking'),
                                    (6, 'Essen & Trinken'),
                                    (7, 'Wellness'),
                                    (8, 'Bildung');

-- =========================
-- LOCATION (Linz Umgebung)
-- =========================
INSERT INTO location (id, longitude, latitude) VALUES
                                                   (1, 14.2858, 48.3069), -- Zentrum
                                                   (2, 14.2905, 48.3055),
                                                   (3, 14.2955, 48.3005),
                                                   (4, 14.2820, 48.3070),
                                                   (5, 14.2755, 48.3045),
                                                   (6, 14.2890, 48.3090),
                                                   (7, 14.2780, 48.3020),
                                                   (8, 14.2920, 48.3030),
                                                   (9, 14.3005, 48.3105),
                                                   (10,14.2700, 48.3085),
                                                   (11,14.2517, 48.2684), -- Leonding
                                                   (12,14.0227, 48.1233); -- Umgebung

-- =========================
-- PARTY (Linz)
-- =========================
INSERT INTO party (id, host_user_id, category_id, location_id, title, time_start, time_end, max_people, min_age, max_age, website, description, fee, created_at) VALUES
                                                                                                                                                                     (1,  2, 1, 1,  'Linz Club Night @ Remembar',      '2026-04-08 22:00:00', '2026-04-08 04:00:00', 200, 18, 35, 'https://remembar.at',     'Charts & EDM Party.',            12.00, NOW()),
                                                                                                                                                                     (2,  3, 1, 2,  'Après Ski Party @ Linzer Alm',    '2026-04-08 21:00:00', '2026-04-08 03:30:00', 180, 18, 40, 'https://linzeralm.at',   'Feiern wie auf der Skihütte.',   10.00, NOW()),
                                                                                                                                                                     (3,  4, 1, 3,  'Techno Night @ PRYSMA',           '2026-04-09 23:00:00', '2026-04-09 06:00:00', 150, 18, 35, 'https://prysma.at',      'Underground Techno.',            15.00, NOW()),
                                                                                                                                                                     (4,  5, 1, 4,  'Latin Party @ M7 Club',           '2026-04-09 20:30:00', '2026-04-09 02:30:00', 120, 18, 45, 'https://m7club.at',      'Reggaeton & Salsa.',             8.00, NOW()),
                                                                                                                                                                     (5,  6, 1, 5,  'HipHop Night',                   '2026-04-10 22:30:00', '2026-04-10 04:30:00', 160, 18, 35, 'https://club.at',        'HipHop & Club Mix.',             10.00, NOW()),
                                                                                                                                                                     (6,  7, 6, 6,  'Afterwork Drinks',               '2026-04-09 18:00:00', '2026-04-09 23:00:00', 90,  18, 50, 'https://bar.at',         'Drinks & entspannte Musik.',     0.00, NOW()),
                                                                                                                                                                     (7,  8, 6, 7,  'Alternative Night',              '2026-04-08 20:00:00', '2026-04-08 01:00:00', 100, 18, 45, 'https://alt.at',         'Indie & Alternative.',           5.00, NOW()),
                                                                                                                                                                     (8,  9, 1, 8,  'Student Party',                  '2026-04-09 21:30:00', '2026-04-09 03:00:00', 140, 18, 30, 'https://stwst.at',       'Studentenparty.',                6.00, NOW()),
                                                                                                                                                                     (9, 10, 1, 9,  'Open Air Party',                 '2026-04-09 16:00:00', '2026-04-09 23:00:00', 220, 16, 40, 'https://linz.at',        'Open Air mit DJs.',              0.00, NOW()),
                                                                                                                                                                     (10,1,  1,10, 'Indie Night @ Kapu',              '2026-04-08 21:00:00', '2026-04-08 02:00:00', 110, 18, 40, 'https://kapu.or.at',     'Live Bands & DJs.',              9.00, NOW());

-- =========================
-- PARTY_USER
-- =========================
INSERT INTO party_user (party_id, user_id) VALUES
                                               (1,2),(1,3),(1,5),
                                               (2,1),(2,4),(2,7),
                                               (3,1),(3,5),
                                               (4,2),(4,3),
                                               (5,1),(5,6),
                                               (6,3),(6,4),
                                               (7,1),(7,10),
                                               (8,2),(8,6),
                                               (9,1),(9,7),
                                               (10,2),(10,3);

-- =========================
-- MEDIA
-- =========================
INSERT INTO media (id, party_id, user_id, file) VALUES
                                                    (1,1,1,'party1.jpg'),
                                                    (2,2,2,'party2.jpg'),
                                                    (3,3,3,'party3.jpg'),
                                                    (4,4,4,'party4.jpg'),
                                                    (5,5,5,'party5.jpg');

-- =========================
-- INVITATION
-- =========================
INSERT INTO invitation (id, sender_id, recipient_id, party_id) VALUES
                                                                   (1,2,1,1),
                                                                   (2,3,1,2),
                                                                   (3,5,1,3),
                                                                   (4,1,2,1),
                                                                   (5,4,2,4);

-- =========================
-- FRIENDSHIP
-- =========================
INSERT INTO follow (user1_id, user2_id, status_id) VALUES
                                                       (1,2,2),(1,3,2),(2,1,2),
                                                       (2,8,2),(3,5,1),(4,2,2),
                                                       (5,7,2),(6,1,1),(7,9,2);

-- =========================
-- RESET SEQUENCES
-- =========================
SELECT setval('users_id_seq',      (SELECT MAX(id) FROM users));
SELECT setval('category_id_seq',   (SELECT MAX(id) FROM category));
SELECT setval('location_id_seq',   (SELECT MAX(id) FROM location));
SELECT setval('party_id_seq',      (SELECT MAX(id) FROM party));
SELECT setval('media_id_seq',      (SELECT MAX(id) FROM media));
SELECT setval('invitation_id_seq', (SELECT MAX(id) FROM invitation));