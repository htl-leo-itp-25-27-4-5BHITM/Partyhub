-- FRIENDSHIP_STATUS
INSERT INTO follow_status (id, name) VALUES
                                             (1, 'ausstehend'),
                                             (2, 'akzeptiert'),
                                             (3, 'blockiert');

-- USERS (using UUIDs for Keycloak compatibility)
INSERT INTO users (id, display_name, distinct_name, email, biography) VALUES
                                                                      ('550e8400-e29b-41d4-a716-446655440001',  'Anna Huber',       'anna_huber',       'anna.huber@wien.at',       'Event-Liebhaberin aus Wien.'),
                                                                      ('550e8400-e29b-41d4-a716-446655440002',  'Michael Wagner',   'michael_wagner',   'michael.wagner@wien.at',   'Tech, Musik und neue Leute kennenlernen.'),
                                                                      ('550e8400-e29b-41d4-a716-446655440003',  'Katrin Bauer',     'katrin_bauer',     'katrin.bauer@wien.at',     'Tanzen, Konzerte, gute Stimmung.'),
                                                                      ('550e8400-e29b-41d4-a716-446655440004',  'Thomas Schneider', 'thomas_schneider', 'thomas.schneider@wien.at', 'Organisiert gerne Veranstaltungen.'),
                                                                      ('550e8400-e29b-41d4-a716-446655440005',  'Sabine Weber',     'sabine_weber',     'sabine.weber@wien.at',     'Networking & Kultur in Wien.'),
                                                                      ('550e8400-e29b-41d4-a716-446655440006',  'Lukas Gruber',     'lukas_gruber',     'lukas.gruber@wien.at',     'Sport & Outdoor – aber auch Partys!'),
                                                                      ('550e8400-e29b-41d4-a716-446655440007',  'Mia Steiner',      'mia_steiner',      'mia.steiner@wien.at',      'Kunst, Food, Afterwork.'),
                                                                      ('550e8400-e29b-41d4-a716-446655440008',  'David König',      'david_koenig',     'david.koenig@wien.at',     'Meetups, Startups, Tech.'),
                                                                      ('550e8400-e29b-41d4-a716-446655440009',  'Nina Fischer',     'nina_fischer',     'nina.fischer@wien.at',     'Yoga, Wellness, entspannte Events.'),
                                                                      ('550e8400-e29b-41d4-a716-446655440010',  'Elias Berger',     'elias_berger',     'elias.berger@wien.at',     'Fotos, Musik, kleine Gigs.');

-- USER_LOCATION
INSERT INTO user_location (user_id, longitude, latitude) VALUES
                                                               ('550e8400-e29b-41d4-a716-446655440001', 16.3738, 48.2082),
                                                               ('550e8400-e29b-41d4-a716-446655440002', 16.3567, 48.2099),
                                                               ('550e8400-e29b-41d4-a716-446655440003', 16.3839, 48.1985),
                                                               ('550e8400-e29b-41d4-a716-446655440004', 16.3500, 48.2200),
                                                               ('550e8400-e29b-41d4-a716-446655440005', 16.3900, 48.2150),
                                                               ('550e8400-e29b-41d4-a716-446655440006', 16.3600, 48.2050);

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
                                                                                                                                                                          (1,  '550e8400-e29b-41d4-a716-446655440001', 1, 1,  'Vienna Rooftop Beats',             '2026-03-19 18:30:00', '2026-03-19 23:30:00', 160, 18, 35, 'https://viennabeats.at',     'DJ Night im Zentrum.',                20.00, NOW()),
                                                                                                                                                                          (2,  '550e8400-e29b-41d4-a716-446655440002', 2, 2,  'AI & Future Meetup Vienna',        '2026-03-20 18:00:00', '2026-03-20 21:00:00', 90,  18, 65, 'https://aivienna.at',        'Talks + Networking zu KI.',            0.00, NOW()),
                                                                                                                                                                          (3,  '550e8400-e29b-41d4-a716-446655440003', 6, 8,  'Naschmarkt Food Walk',             '2026-03-19 17:00:00', '2026-03-19 20:00:00', 40,  16, 70, 'https://naschmarkt-walk.at', 'Gemeinsam durch die Stände.',         12.00, NOW()),
                                                                                                                                                                          (4,  '550e8400-e29b-41d4-a716-446655440004', 4, 2,  'Art Night im MQ',                  '2026-03-19 18:00:00', '2026-03-19 22:00:00', 70,  18, 70, 'https://artnight.at',        'Kunst + kleine Drinks.',              15.00, NOW()),
                                                                                                                                                                          (5,  '550e8400-e29b-41d4-a716-446655440005', 5, 10, 'Startup Networking @ Rathausplatz','2026-03-20 19:00:00', '2026-03-20 22:30:00', 140, 18, 55, 'https://startupvienna.at',   'Entspanntes Networking.',              5.00, NOW()),
                                                                                                                                                                          (6,  '550e8400-e29b-41d4-a716-446655440006', 3, 3,  'Donauinsel Beach Volleyball',      '2026-03-22 14:00:00', '2026-03-22 18:30:00', 60,  16, 45, 'https://donau-volley.at',    'Freies Spielen + Mini-Turnier.',       8.00, NOW()),
                                                                                                                                                                          (7,  '550e8400-e29b-41d4-a716-446655440007', 6, 7,  'Afterwork Spritz & Snacks',        '2026-03-20 18:00:00', '2026-03-20 21:30:00', 80,  18, 65, 'https://afterwork-wien.at',  'Casual Afterwork.',                    0.00, NOW()),
                                                                                                                                                                          (8,  '550e8400-e29b-41d4-a716-446655440008', 8, 4,  'Workshop: Event-Fotos mit Handy',  '2026-03-21 17:30:00', '2026-03-21 20:30:00', 35,  16, 70, 'https://photo-workshop.at',  'Tipps zu Licht und Komposition.',     10.00, NOW()),
                                                                                                                                                                          (9,  '550e8400-e29b-41d4-a716-446655440009', 7, 6,  'Sunset Yoga im Augarten',          '2026-03-20 17:00:00', '2026-03-20 18:30:00', 50,  14, 70, 'https://yoga-augarten.at',   'Entspanntes Yoga.',                    6.00, NOW()),
                                                                                                                                                                          (10, '550e8400-e29b-41d4-a716-446655440010',1, 9,  'Indie Live Session @ Praterstern', '2026-03-23 19:30:00', '2026-03-23 22:30:00', 120, 16, 60, 'https://indie-session.at',   'Kleine Live-Gigs.',                    9.00, NOW()),
                                                                                                                                                                          (11, '550e8400-e29b-41d4-a716-446655440001', 1, 11, 'HTL Leonding',                     '2026-03-24 08:00:00', '2026-03-24 18:00:00', 200, 14, 25, 'https://htl-leonding.at',    'HTL Leonding Schulveranstaltung.',     0.00, NOW()),
                                                                                                                                                                          (12, '550e8400-e29b-41d4-a716-446655440001', 1, 12, 'Meine Party',                      '2026-03-25 20:00:00', '2026-03-25 02:00:00', 50,  16, 99, '',                           'Meine eigene Party.',                  0.00, NOW());

-- PARTY_USER
INSERT INTO party_user (party_id, user_id) VALUES
                                               (1,'550e8400-e29b-41d4-a716-446655440002'),(1,'550e8400-e29b-41d4-a716-446655440003'),(1,'550e8400-e29b-41d4-a716-446655440005'),(1,'550e8400-e29b-41d4-a716-446655440008'),
                                               (2,'550e8400-e29b-41d4-a716-446655440001'),(2,'550e8400-e29b-41d4-a716-446655440004'),(2,'550e8400-e29b-41d4-a716-446655440007'),(2,'550e8400-e29b-41d4-a716-446655440010'),
                                               (3,'550e8400-e29b-41d4-a716-446655440001'),(3,'550e8400-e29b-41d4-a716-446655440005'),(3,'550e8400-e29b-41d4-a716-446655440007'),
                                               (4,'550e8400-e29b-41d4-a716-446655440002'),(4,'550e8400-e29b-41d4-a716-446655440003'),(4,'550e8400-e29b-41d4-a716-446655440008'),
                                               (5,'550e8400-e29b-41d4-a716-446655440001'),(5,'550e8400-e29b-41d4-a716-446655440002'),(5,'550e8400-e29b-41d4-a716-446655440006'),(5,'550e8400-e29b-41d4-a716-446655440007'),(5,'550e8400-e29b-41d4-a716-446655440008'),
                                               (6,'550e8400-e29b-41d4-a716-446655440003'),(6,'550e8400-e29b-41d4-a716-446655440004'),(6,'550e8400-e29b-41d4-a716-446655440005'),(6,'550e8400-e29b-41d4-a716-446655440009'),
                                               (7,'550e8400-e29b-41d4-a716-446655440001'),(7,'550e8400-e29b-41d4-a716-446655440003'),(7,'550e8400-e29b-41d4-a716-446655440005'),(7,'550e8400-e29b-41d4-a716-446655440010'),
                                               (8,'550e8400-e29b-41d4-a716-446655440002'),(8,'550e8400-e29b-41d4-a716-446655440006'),(8,'550e8400-e29b-41d4-a716-446655440007'),(8,'550e8400-e29b-41d4-a716-446655440010'),
                                               (9,'550e8400-e29b-41d4-a716-446655440001'),(9,'550e8400-e29b-41d4-a716-446655440007'),(9,'550e8400-e29b-41d4-a716-446655440008'),
                                               (10,'550e8400-e29b-41d4-a716-446655440002'),(10,'550e8400-e29b-41d4-a716-446655440003'),(10,'550e8400-e29b-41d4-a716-446655440004'),(10,'550e8400-e29b-41d4-a716-446655440005'),(10,'550e8400-e29b-41d4-a716-446655440009');

-- MEDIA
INSERT INTO media (id, party_id, user_id, file) VALUES
                                                     (1,  1,  '550e8400-e29b-41d4-a716-446655440001',  'party1_rooftop.jpg'),
                                                     (2,  1,  '550e8400-e29b-41d4-a716-446655440003',  'party1_dj.jpg'),
                                                     (3,  2,  '550e8400-e29b-41d4-a716-446655440002',  'party2_ai_slide.jpg'),
                                                     (4,  2,  '550e8400-e29b-41d4-a716-446655440008',  'party2_networking.jpg'),
                                                     (5,  3,  '550e8400-e29b-41d4-a716-446655440005',  'party3_food.jpg'),
                                                     (6,  4,  '550e8400-e29b-41d4-a716-446655440007',  'party4_art.jpg'),
                                                     (7,  5,  '550e8400-e29b-41d4-a716-446655440008',  'party5_startup.jpg'),
                                                     (8,  6,  '550e8400-e29b-41d4-a716-446655440006',  'party6_volley.jpg'),
                                                     (9,  7,  '550e8400-e29b-41d4-a716-446655440007',  'party7_afterwork.jpg'),
                                                     (10, 8,  '550e8400-e29b-41d4-a716-446655440010',  'party8_workshop.jpg'),
                                                     (11, 9,  '550e8400-e29b-41d4-a716-446655440009',  'party9_yoga.jpg'),
                                                     (12, 10, '550e8400-e29b-41d4-a716-446655440010',  'party10_indie.jpg');

-- INVITATION
INSERT INTO invitation (id, sender_id, recipient_id, party_id) VALUES
                                                                    (101, '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 2),(102, '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 3),(103, '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 5),
                                                                    (104, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 1),(105, '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 4),
                                                                    (106, '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 2),(107, '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 6),
                                                                    (108, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 1),
                                                                    (109, '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 3),(110, '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440005', 7),
                                                                    (111, '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440006', 8),
                                                                    (112, '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440007', 9),
                                                                    (113, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440008', 1),(114, '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440008', 10),
                                                                    (115, '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440009', 5),
                                                                    (116, '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440010', 4);

-- FRIENDSHIP
INSERT INTO follow (user1_id, user2_id, status_id) VALUES
                                                            ('550e8400-e29b-41d4-a716-446655440001','550e8400-e29b-41d4-a716-446655440002',2),('550e8400-e29b-41d4-a716-446655440001','550e8400-e29b-41d4-a716-446655440003',2),('550e8400-e29b-41d4-a716-446655440002','550e8400-e29b-41d4-a716-446655440001',2),('550e8400-e29b-41d4-a716-446655440002','550e8400-e29b-41d4-a716-446655440008',2),('550e8400-e29b-41d4-a716-446655440003','550e8400-e29b-41d4-a716-446655440005',1),
                                                            ('550e8400-e29b-41d4-a716-446655440004','550e8400-e29b-41d4-a716-446655440002',2),('550e8400-e29b-41d4-a716-446655440005','550e8400-e29b-41d4-a716-446655440007',2),('550e8400-e29b-41d4-a716-446655440006','550e8400-e29b-41d4-a716-446655440001',1),('550e8400-e29b-41d4-a716-446655440007','550e8400-e29b-41d4-a716-446655440009',2),('550e8400-e29b-41d4-a716-446655440008','550e8400-e29b-41d4-a716-446655440010',2),
                                                            ('550e8400-e29b-41d4-a716-446655440009','550e8400-e29b-41d4-a716-446655440006',2),('550e8400-e29b-41d4-a716-446655440010','550e8400-e29b-41d4-a716-446655440003',3);

-- RESET SEQUENCES (only for auto-generated IDs, not UUIDs)
SELECT setval('category_id_seq',   (SELECT MAX(id) FROM category));
SELECT setval('location_id_seq',   (SELECT MAX(id) FROM location));
SELECT setval('party_id_seq',      (SELECT MAX(id) FROM party));
SELECT setval('media_id_seq',      (SELECT MAX(id) FROM media));
SELECT setval('invitation_id_seq', (SELECT MAX(id) FROM invitation));
