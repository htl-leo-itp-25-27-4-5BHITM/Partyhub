-- FRIENDSHIP_STATUS
INSERT INTO follow_status (id, name) VALUES
                                             (1, 'ausstehend'),
                                             (2, 'akzeptiert'),
                                             (3, 'blockiert');

-- USERS
INSERT INTO users (id, display_name, distinct_name, email, biography) VALUES
                                                                          (1,  'Anna Huber',       'anna_huber',       '[anna.huber@wien.at](mailto:anna.huber@wien.at)',       'Event-Liebhaberin aus Wien.'),
                                                                          (2,  'Michael Wagner',   'michael_wagner',   '[michael.wagner@wien.at](mailto:michael.wagner@wien.at)',   'Tech, Musik und neue Leute kennenlernen.'),
                                                                          (3,  'Katrin Bauer',     'katrin_bauer',     '[katrin.bauer@wien.at](mailto:katrin.bauer@wien.at)',     'Tanzen, Konzerte, gute Stimmung.'),
                                                                          (4,  'Thomas Schneider', 'thomas_schneider', '[thomas.schneider@wien.at](mailto:thomas.schneider@wien.at)', 'Organisiert gerne Veranstaltungen.'),
                                                                          (5,  'Sabine Weber',     'sabine_weber',     '[sabine.weber@wien.at](mailto:sabine.weber@wien.at)',     'Networking & Kultur in Wien.'),
                                                                          (6,  'Lukas Gruber',     'lukas_gruber',     '[lukas.gruber@wien.at](mailto:lukas.gruber@wien.at)',     'Sport & Outdoor – aber auch Partys!'),
                                                                          (7,  'Mia Steiner',      'mia_steiner',      '[mia.steiner@wien.at](mailto:mia.steiner@wien.at)',      'Kunst, Food, Afterwork.'),
                                                                          (8,  'David König',      'david_koenig',     '[david.koenig@wien.at](mailto:david.koenig@wien.at)',     'Meetups, Startups, Tech.'),
                                                                          (9,  'Nina Fischer',     'nina_fischer',     '[nina.fischer@wien.at](mailto:nina.fischer@wien.at)',     'Yoga, Wellness, entspannte Events.'),
                                                                          (10, 'Elias Berger',     'elias_berger',     '[elias.berger@wien.at](mailto:elias.berger@wien.at)',     'Fotos, Musik, kleine Gigs.');

-- USER_LOCATION
INSERT INTO user_location (user_id, longitude, latitude) VALUES
                                                               (1, 16.3738, 48.2082),
                                                               (2, 16.3567, 48.2099),
                                                               (3, 16.3839, 48.1985),
                                                               (4, 16.3500, 48.2200),
                                                               (5, 16.3900, 48.2150),
                                                               (6, 16.3600, 48.2050);

-- CATEGORY
INSERT INTO category (id, name) VALUES
                                    (1, 'Musik'),
                                    (2, 'Technologie'),
                                    (3, 'Sport'),
                                    (4, 'Kunst'),
                                    (5, 'Networking'),
                                    (6, 'Essen & Trinken'),
                                    (7, 'Wellness'),
                                    (8, 'Bildung');

-- LOCATION
INSERT INTO location (id, longitude, latitude) VALUES
                                                   (1,  16.3738,    48.2082),
                                                   (2,  16.3600,    48.2000),
                                                   (3,  16.4200,    48.2180),
                                                   (4,  16.3690,    48.2035),
                                                   (5,  16.3122,    48.1845),
                                                   (6,  16.3769,    48.2167),
                                                   (7,  16.3550,    48.2080),
                                                   (8,  16.3790,    48.2050),
                                                   (9,  16.3950,    48.2160),
                                                   (10, 16.3415,    48.2105),
                                                   (11, 14.2517532, 48.2684159),
                                                   (12, 14.022701,  48.123327);

-- PARTY
INSERT INTO party (id, host_user_id, category_id, location_id, title, time_start, time_end, max_people, min_age, max_age, website, description, fee, created_at) VALUES
                                                                                                                                                                     (1,  1, 1, 1,  'Vienna Rooftop Beats',             '2026-03-19 18:30:00', '2026-03-19 23:30:00', 160, 18, 35, 'https://viennabeats.at',     'DJ Night im Zentrum.',                20.00, NOW()),
                                                                                                                                                                     (2,  2, 2, 2,  'AI & Future Meetup Vienna',        '2026-03-20 18:00:00', '2026-03-20 21:00:00', 90,  18, 65, 'https://aivienna.at',        'Talks + Networking zu KI.',            0.00, NOW()),
                                                                                                                                                                     (3,  3, 6, 8,  'Naschmarkt Food Walk',             '2026-03-19 17:00:00', '2026-03-19 20:00:00', 40,  16, 70, 'https://naschmarkt-walk.at', 'Gemeinsam durch die Stände.',         12.00, NOW()),
                                                                                                                                                                     (4,  4, 4, 2,  'Art Night im MQ',                  '2026-03-19 18:00:00', '2026-03-19 22:00:00', 70,  18, 70, 'https://artnight.at',        'Kunst + kleine Drinks.',              15.00, NOW()),
                                                                                                                                                                     (5,  5, 5, 10, 'Startup Networking @ Rathausplatz','2026-03-20 19:00:00', '2026-03-20 22:30:00', 140, 18, 55, 'https://startupvienna.at',   'Entspanntes Networking.',              5.00, NOW()),
                                                                                                                                                                     (6,  6, 3, 3,  'Donauinsel Beach Volleyball',      '2026-03-22 14:00:00', '2026-03-22 18:30:00', 60,  16, 45, 'https://donau-volley.at',    'Freies Spielen + Mini-Turnier.',       8.00, NOW()),
                                                                                                                                                                     (7,  7, 6, 7,  'Afterwork Spritz & Snacks',        '2026-03-20 18:00:00', '2026-03-20 21:30:00', 80,  18, 65, 'https://afterwork-wien.at',  'Casual Afterwork.',                    0.00, NOW()),
                                                                                                                                                                     (8,  8, 8, 4,  'Workshop: Event-Fotos mit Handy',  '2026-03-21 17:30:00', '2026-03-21 20:30:00', 35,  16, 70, 'https://photo-workshop.at',  'Tipps zu Licht und Komposition.',     10.00, NOW()),
                                                                                                                                                                     (9,  9, 7, 6,  'Sunset Yoga im Augarten',          '2026-03-20 17:00:00', '2026-03-20 18:30:00', 50,  14, 70, 'https://yoga-augarten.at',   'Entspanntes Yoga.',                    6.00, NOW()),
                                                                                                                                                                     (10, 10,1, 9,  'Indie Live Session @ Praterstern', '2026-03-23 19:30:00', '2026-03-23 22:30:00', 120, 16, 60, 'https://indie-session.at',   'Kleine Live-Gigs.',                    9.00, NOW()),
                                                                                                                                                                     (11, 1, 1, 11, 'HTL Leonding',                     '2026-03-24 08:00:00', '2026-03-24 18:00:00', 200, 14, 25, 'https://htl-leonding.at',    'HTL Leonding Schulveranstaltung.',     0.00, NOW()),
                                                                                                                                                                     (12, 1, 1, 12, 'Meine Party',                      '2026-03-25 20:00:00', '2026-03-25 02:00:00', 50,  16, 99, '',                           'Meine eigene Party.',                  0.00, NOW());

-- PARTY_USER
INSERT INTO party_user (party_id, user_id) VALUES
                                               (1,2),(1,3),(1,5),(1,8),
                                               (2,1),(2,4),(2,7),(2,10),
                                               (3,1),(3,5),(3,7),
                                               (4,2),(4,3),(4,8),
                                               (5,1),(5,2),(5,6),(5,7),(5,8),
                                               (6,3),(6,4),(6,5),(6,9),
                                               (7,1),(7,3),(7,5),(7,10),
                                               (8,2),(8,6),(8,7),(8,10),
                                               (9,1),(9,7),(9,8),
                                               (10,2),(10,3),(10,4),(10,5),(10,9);

-- MEDIA
INSERT INTO media (id, party_id, user_id, file) VALUES
                                                    (1,  1,  1,  'party1_rooftop.jpg'),
                                                    (2,  1,  3,  'party1_dj.jpg'),
                                                    (3,  2,  2,  'party2_ai_slide.jpg'),
                                                    (4,  2,  8,  'party2_networking.jpg'),
                                                    (5,  3,  5,  'party3_food.jpg'),
                                                    (6,  4,  7,  'party4_art.jpg'),
                                                    (7,  5,  8,  'party5_startup.jpg'),
                                                    (8,  6,  6,  'party6_volley.jpg'),
                                                    (9,  7,  7,  'party7_afterwork.jpg'),
                                                    (10, 8,  10, 'party8_workshop.jpg'),
                                                    (11, 9,  9,  'party9_yoga.jpg'),
                                                    (12, 10, 10, 'party10_indie.jpg');

-- INVITATION
INSERT INTO invitation (id, sender_id, recipient_id, party_id) VALUES
                                                                   (101, 2, 1, 2),(102, 3, 1, 3),(103, 5, 1, 5),
                                                                   (104, 1, 2, 1),(105, 4, 2, 4),
                                                                   (106, 2, 3, 2),(107, 6, 3, 6),
                                                                   (108, 1, 4, 1),
                                                                   (109, 3, 5, 3),(110, 7, 5, 7),
                                                                   (111, 8, 6, 8),
                                                                   (112, 9, 7, 9),
                                                                   (113, 1, 8, 1),(114, 10, 8, 10),
                                                                   (115, 5, 9, 5),
                                                                   (116, 4, 10, 4);

-- FRIENDSHIP
INSERT INTO follow (user1_id, user2_id, status_id) VALUES
                                                           (1,2,2),(1,3,2),(2,1,2),(2,8,2),(3,5,1),
                                                           (4,2,2),(5,7,2),(6,1,1),(7,9,2),(8,10,2),
                                                           (9,6,2),(10,3,3);

-- RESET SEQUENCES
SELECT setval('users_id_seq',      (SELECT MAX(id) FROM users));
SELECT setval('category_id_seq',   (SELECT MAX(id) FROM category));
SELECT setval('location_id_seq',   (SELECT MAX(id) FROM location));
SELECT setval('party_id_seq',      (SELECT MAX(id) FROM party));
SELECT setval('media_id_seq',      (SELECT MAX(id) FROM media));
SELECT setval('invitation_id_seq', (SELECT MAX(id) FROM invitation));
