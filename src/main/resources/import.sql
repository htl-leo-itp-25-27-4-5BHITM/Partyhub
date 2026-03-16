-- =========================================================
-- IMPORT.SQL  (PostgreSQL / Quarkus / GenerationType.IDENTITY)
-- =========================================================
-- Reihenfolge: follow_status -> users -> profile_picture -> category -> location
--              -> party -> party_user -> media -> invitation -> follow
-- =========================================================

-- -------------------------
-- FOLLOW_STATUS
-- -------------------------
INSERT INTO follow_status (id, name) VALUES
                                         (1, 'ausstehend'),
                                         (2, 'akzeptiert'),
                                         (3, 'blockiert');

-- -------------------------
-- USERS  (KEIN profile_picture Feld!)
-- -------------------------
INSERT INTO users (id, display_name, distinct_name, email, biography) VALUES
                                                                          (1, 'Anna Huber',     'anna_h',    'anna.huber@wien.at',     'Event-Liebhaberin aus Wien.'),
                                                                          (2, 'Michael Wagner', 'michi_w',   'michael.wagner@wien.at', 'Tech, Musik und neue Leute kennenlernen.'),
                                                                          (3, 'Katrin Bauer',   'katrin_b',  'katrin.bauer@wien.at',   'Tanzen, Konzerte, gute Stimmung.'),
                                                                          (4, 'Thomas Schneider','thomas_s', 'thomas.schneider@wien.at','Organisiert gerne Veranstaltungen.'),
                                                                          (5, 'Sabine Weber',   'sabine_w',  'sabine.weber@wien.at',   'Networking & Kultur in Wien.'),
                                                                          (6, 'Lukas Gruber',   'lukas_g',   'lukas.gruber@wien.at',   'Sport & Outdoor – aber auch Partys!'),
                                                                          (7, 'Mia Steiner',    'mia_s',     'mia.steiner@wien.at',    'Kunst, Food, Afterwork.'),
                                                                          (8, 'David König',    'david_k',   'david.koenig@wien.at',   'Meetups, Startups, Tech.'),
                                                                          (9, 'Nina Fischer',   'nina_f',    'nina.fischer@wien.at',   'Yoga, Wellness, entspannte Events.'),
                                                                          (10,'Elias Berger',   'elias_b',   'elias.berger@wien.at',   'Fotos, Musik, kleine Gigs.');

-- -------------------------
-- PROFILE_PICTURE
-- Tabelle: profile_picture(id, picture_name, user_id)
-- (user_id Default-Name, weil @OneToOne ohne @JoinColumn)
-- -------------------------
INSERT INTO profile_picture (id, picture_name, user_id) VALUES
                                                            (1, 'pp_anna.jpg', 1),
                                                            (2, 'pp_michi.jpg', 2),
                                                            (3, 'pp_katrin.jpg', 3),
                                                            (4, 'pp_thomas.jpg', 4),
                                                            (5, 'pp_sabine.jpg', 5),
                                                            (6, 'pp_lukas.jpg', 6),
                                                            (7, 'pp_mia.jpg', 7),
                                                            (8, 'pp_david.jpg', 8),
                                                            (9, 'pp_nina.jpg', 9),
                                                            (10,'pp_elias.jpg',10);

-- -------------------------
-- CATEGORY
-- -------------------------
INSERT INTO category (id, name) VALUES
                                    (1, 'Musik'),
                                    (2, 'Technologie'),
                                    (3, 'Sport'),
                                    (4, 'Kunst'),
                                    (5, 'Networking'),
                                    (6, 'Essen & Trinken'),
                                    (7, 'Wellness'),
                                    (8, 'Bildung');

-- -------------------------
-- LOCATION (Wien)
-- location(id, longitude, latitude, address)
-- -------------------------
INSERT INTO location (id, longitude, latitude, address) VALUES
                                                            (1, 16.3738, 48.2082, 'Stephansplatz, 1010 Wien'),
                                                            (2, 16.3600, 48.2000, 'MuseumsQuartier, 1070 Wien'),
                                                            (3, 16.4200, 48.2180, 'Donauinsel, 1220 Wien'),
                                                            (4, 16.3690, 48.2035, 'Karlsplatz, 1040 Wien'),
                                                            (5, 16.3122, 48.1845, 'Schönbrunn, 1130 Wien'),
                                                            (6, 16.3769, 48.2167, 'Augarten, 1020 Wien'),
                                                            (7, 16.3550, 48.2080, 'Mariahilfer Straße, 1060 Wien'),
                                                            (8, 16.3790, 48.2050, 'Naschmarkt, 1060 Wien'),
                                                            (9, 16.3950, 48.2160, 'Praterstern, 1020 Wien'),
                                                            (10,16.3415, 48.2105, 'Rathausplatz, 1010 Wien');

-- -------------------------
-- PARTY (nächste 2 Wochen: 2026-03-04 bis 2026-03-17)
-- party(id, host_user_id, category_id, location_id, title, time_start, time_end,
--       max_people, min_age, max_age, website, description, fee, created_at)
-- -------------------------
INSERT INTO party (
    id, host_user_id, category_id, location_id,
    title, time_start, time_end,
    max_people, min_age, max_age,
    website, description, fee, created_at
) VALUES
      (1,  1, 1, 1,
       'Vienna Rooftop Beats',
       '2026-03-04 18:30:00', '2026-03-04 23:30:00',
       160, 18, 35,
       'https://viennabeats.at',
       'DJ Night im Zentrum – gute Vibes & Blick über die Stadt.',
       20.00, NOW()),

      (2,  2, 2, 2,
       'AI & Future Meetup Vienna',
       '2026-03-05 18:00:00', '2026-03-05 21:00:00',
       90, 18, 65,
       'https://aivienna.at',
       'Talks + Networking zu KI, Startups und Tools.',
       0.00, NOW()),

      (3,  3, 6, 8,
       'Naschmarkt Food Walk',
       '2026-03-06 17:00:00', '2026-03-06 20:00:00',
       40, 16, 70,
       'https://naschmarkt-walk.at',
       'Gemeinsam probieren wir uns durch Stände & kleine Spots.',
       12.00, NOW()),

      (4,  4, 4, 2,
       'Art Night im MQ',
       '2026-03-07 18:00:00', '2026-03-07 22:00:00',
       70, 18, 70,
       'https://artnight.at',
       'Kunst + kleine Drinks + lockerer Austausch.',
       15.00, NOW()),

      (5,  5, 5, 10,
       'Startup Networking @ Rathausplatz',
       '2026-03-08 19:00:00', '2026-03-08 22:30:00',
       140, 18, 55,
       'https://startupvienna.at',
       'Gründer, Devs, Design, Invest – entspanntes Networking.',
       5.00, NOW()),

      (6,  6, 3, 3,
       'Donauinsel Beach Volleyball',
       '2026-03-10 14:00:00', '2026-03-10 18:30:00',
       60, 16, 45,
       'https://donau-volley.at',
       'Freies Spielen + Mini-Turnier, Teams vor Ort.',
       8.00, NOW()),

      (7,  7, 6, 7,
       'Afterwork Spritz & Snacks',
       '2026-03-11 18:00:00', '2026-03-11 21:30:00',
       80, 18, 65,
       'https://afterwork-wien.at',
       'Casual Afterwork – gute Gespräche, kleine Snacks.',
       0.00, NOW()),

      (8,  8, 8, 4,
       'Workshop: Event-Fotos mit Handy',
       '2026-03-12 17:30:00', '2026-03-12 20:30:00',
       35, 16, 70,
       'https://photo-workshop.at',
       'Tipps zu Licht, Komposition und schnellen Edits.',
       10.00, NOW()),

      (9,  9, 7, 6,
       'Sunset Yoga im Augarten',
       '2026-03-14 17:00:00', '2026-03-14 18:30:00',
       50, 14, 70,
       'https://yoga-augarten.at',
       'Entspanntes Yoga + kleine Tea-Station danach.',
       6.00, NOW()),

      (10, 10, 1, 9,
       'Indie Live Session @ Praterstern',
       '2026-03-16 19:30:00', '2026-03-16 22:30:00',
       120, 16, 60,
       'https://indie-session.at',
       'Kleine Live-Gigs + chillige Atmosphäre.',
       9.00, NOW());

-- -------------------------
-- PARTY_USER (Many-to-Many)
-- -------------------------
INSERT INTO party_user (party_id, user_id) VALUES
-- Party 1
(1,2),(1,3),(1,5),(1,8),
-- Party 2
(2,1),(2,4),(2,7),(2,10),
-- Party 3
(3,1),(3,5),(3,7),
-- Party 4
(4,2),(4,3),(4,8),
-- Party 5
(5,1),(5,2),(5,6),(5,7),(5,8),
-- Party 6
(6,3),(6,4),(6,5),(6,9),
-- Party 7
(7,1),(7,3),(7,5),(7,10),
-- Party 8
(8,2),(8,6),(8,7),(8,10),
-- Party 9
(9,1),(9,7),(9,8),
-- Party 10
(10,2),(10,3),(10,4),(10,5),(10,9);

-- -------------------------
-- MEDIA
-- media(id, party_id, user_id, file)
-- -------------------------
INSERT INTO media (id, party_id, user_id, file) VALUES
                                                    (1, 1, 1, 'party1_rooftop.jpg'),
                                                    (2, 1, 3, 'party1_dj.jpg'),
                                                    (3, 2, 2, 'party2_ai_slide.jpg'),
                                                    (4, 2, 8, 'party2_networking.jpg'),
                                                    (5, 3, 5, 'party3_food.jpg'),
                                                    (6, 4, 7, 'party4_art.jpg'),
                                                    (7, 5, 8, 'party5_startup.jpg'),
                                                    (8, 6, 6, 'party6_volley.jpg'),
                                                    (9, 7, 7, 'party7_afterwork.jpg'),
                                                    (10,8,10,'party8_workshop.jpg'),
                                                    (11,9, 9, 'party9_yoga.jpg'),
                                                    (12,10,10,'party10_indie.jpg');

-- -------------------------
-- INVITATION
-- invitation(id, sender_id, recipient_id, party_id)
-- -------------------------
-- Alte Invitations optional löschen (nur wenn du neu starten willst)
-- DELETE FROM invitation;

INSERT INTO invitation (id, sender_id, recipient_id, party_id) VALUES
-- User 1 bekommt 3 Einladungen
(101, 2, 1, 2),
(102, 3, 1, 3),
(103, 5, 1, 5),

-- User 2 bekommt 2 Einladungen
(104, 1, 2, 1),
(105, 4, 2, 4),

-- User 3 bekommt 2 Einladungen
(106, 2, 3, 2),
(107, 6, 3, 6),

-- User 4 bekommt 1 Einladung
(108, 1, 4, 1),

-- User 5 bekommt 2 Einladungen
(109, 3, 5, 3),
(110, 7, 5, 7),

-- User 6 bekommt 1 Einladung
(111, 8, 6, 8),

-- User 7 bekommt 1 Einladung
(112, 9, 7, 9),

-- User 8 bekommt 2 Einladungen
(113, 1, 8, 1),
(114, 10, 8, 10),

-- User 9 bekommt 1 Einladung
(115, 5, 9, 5),

-- User 10 bekommt 1 Einladung
(116, 4, 10, 4);
-- -------------------------
-- FOLLOW
-- follow(user1_id, user2_id, status_id)
-- -------------------------
INSERT INTO follow (user1_id, user2_id, status_id) VALUES
                                                       (1, 2, 2),
                                                       (1, 3, 2),
                                                       (2, 1, 2),
                                                       (2, 8, 2),
                                                       (3, 5, 1),
                                                       (4, 2, 2),
                                                       (5, 7, 2),
                                                       (6, 1, 1),
                                                       (7, 9, 2),
                                                       (8,10, 2),
                                                       (9, 6, 2),
                                                       (10,3, 3);

INSERT INTO user_location (latitude, longitude, user_id)
VALUES (48.2797, 14.2533, 1);

INSERT INTO user_location (latitude, longitude, user_id)
VALUES (48.2812, 14.2508, 2);

INSERT INTO user_location (latitude, longitude, user_id)
VALUES (48.2779, 14.2571, 3);


-- -------------------------
-- LOCATION (Leonding)
-- -------------------------
INSERT INTO location (id, longitude, latitude, address) VALUES
                                                            (11, 14.2517532, 48.2684159, 'HTL Leonding, Leonding'),
                                                            (12, 14.022701,  48.123327,  'Mein Ort');

-- -------------------------
-- PARTY
-- -------------------------
INSERT INTO party (
    id, host_user_id, category_id, location_id,
    title, time_start, time_end,
    max_people, min_age, max_age,
    website, description, fee, created_at
) VALUES
      (11, 1, 1, 11,
       'HTL Leonding',
       '2026-03-16 08:00:00', '2026-03-16 18:00:00',
       200, 14, 25,
       'https://htl-leonding.at',
       'HTL Leonding Schulveranstaltung.',
       0.00, NOW()),

      (12, 1, 1, 12,
       'Meine Party',
       '2026-03-16 20:00:00', '2026-03-17 02:00:00',
       50, 16, 99,
       '',
       'Meine eigene Party.',
       0.00, NOW());

-- Reset sequences
SELECT setval('location_id_seq', (SELECT MAX(id) FROM location));
SELECT setval('party_id_seq',    (SELECT MAX(id) FROM party));
-- -------------------------
-- RESET SEQUENCES
-- -------------------------
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('profile_picture_id_seq', (SELECT MAX(id) FROM profile_picture));
SELECT setval('category_id_seq', (SELECT MAX(id) FROM category));
SELECT setval('location_id_seq', (SELECT MAX(id) FROM location));
SELECT setval('party_id_seq', (SELECT MAX(id) FROM party));
SELECT setval('media_id_seq', (SELECT MAX(id) FROM media));
SELECT setval('invitation_id_seq', (SELECT MAX(id) FROM invitation));