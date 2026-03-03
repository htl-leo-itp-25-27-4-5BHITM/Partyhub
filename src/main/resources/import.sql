-- =========================
-- USERS
-- =========================
INSERT INTO users (id, display_name, distinct_name, email, biography) VALUES
                                                                          (1, 'Anna Huber', 'anna_h', 'anna.huber@wien.at', 'Event-Liebhaberin aus Wien'),
                                                                          (2, 'Michael Wagner', 'michi_w', 'michael.wagner@wien.at', 'Tech & Party Fan'),
                                                                          (3, 'Katrin Bauer', 'katrin_b', 'katrin.bauer@wien.at', 'Musik begeistert'),
                                                                          (4, 'Thomas Schneider', 'thomas_s', 'thomas.schneider@wien.at', 'Organisiert gerne Events'),
                                                                          (5, 'Sabine Weber', 'sabine_w', 'sabine.weber@wien.at', 'Immer auf der Suche nach neuen Events');

-- =========================
-- CATEGORIES
-- =========================
INSERT INTO category (id, name) VALUES
                                    (1, 'Musik'),
                                    (2, 'Technologie'),
                                    (3, 'Sport'),
                                    (4, 'Kunst'),
                                    (5, 'Networking');

-- =========================
-- LOCATIONS (Wien)
-- =========================
INSERT INTO location (id, longitude, latitude, address) VALUES
                                                            (1, 16.3738, 48.2082, 'Stephansplatz, 1010 Wien'),
                                                            (2, 16.3600, 48.2000, 'MuseumsQuartier, 1070 Wien'),
                                                            (3, 16.4200, 48.2180, 'Donauinsel, 1220 Wien'),
                                                            (4, 16.3725, 48.2030, 'Karlsplatz, 1040 Wien'),
                                                            (5, 16.3419, 48.1970, 'Schönbrunn, 1130 Wien');

-- =========================
-- PARTYS IN WIEN
-- =========================
INSERT INTO party (
    id,
    host_user_id,
    category_id,
    location_id,
    title,
    time_start,
    time_end,
    max_people,
    min_age,
    max_age,
    website,
    description,
    fee,
    created_at
) VALUES
      (1, 1, 1, 1,
       'Vienna Summer Beats',
       '2026-06-15 18:00:00',
       '2026-06-15 23:00:00',
       200, 18, 35,
       'https://viennabeats.at',
       'Open-Air DJ Event am Stephansplatz.',
       25.00,
       '2026-01-01 10:00:00'),

      (2, 2, 2, 2,
       'AI Meetup Vienna',
       '2026-05-10 18:30:00',
       '2026-05-10 21:30:00',
       80, 18, 60,
       'https://aivienna.at',
       'Diskussion über KI & Zukunft.',
       0.00,
       '2026-01-10 12:00:00'),

      (3, 3, 3, 3,
       'Donauinsel Volleyball Cup',
       '2026-07-20 10:00:00',
       '2026-07-20 17:00:00',
       100, 16, 40,
       'https://volleyvienna.at',
       'Beachvolleyball Turnier an der Donau.',
       10.00,
       '2026-02-01 09:00:00'),

      (4, 4, 4, 4,
       'Art Night Vienna',
       '2026-04-05 17:00:00',
       '2026-04-05 21:00:00',
       60, 18, 65,
       'https://artnight.at',
       'Moderne Kunst & Networking.',
       15.00,
       '2026-02-10 14:00:00'),

      (5, 5, 5, 5,
       'Startup Networking Vienna',
       '2026-05-25 19:00:00',
       '2026-05-25 22:00:00',
       120, 18, 50,
       'https://startupvienna.at',
       'Treffen für Gründer & Investoren.',
       5.00,
       '2026-03-01 16:00:00');

-- =========================
-- PARTY_USER (ManyToMany)
-- =========================
INSERT INTO party_user (party_id, user_id) VALUES
                                               (1, 2),
                                               (1, 3),
                                               (2, 1),
                                               (3, 5),
                                               (4, 2),
                                               (5, 3);

-- =========================
-- MEDIA
-- =========================
INSERT INTO media (id, party_id, user_id, file) VALUES
                                                    (1, 1, 1, 'vienna_beats.jpg'),
                                                    (2, 2, 2, 'ai_meetup.jpg'),
                                                    (3, 3, 3, 'volleyball.jpg'),
                                                    (4, 4, 4, 'artnight.jpg'),
                                                    (5, 5, 5, 'networking.jpg');

-- =========================
-- INVITATIONS
-- =========================
INSERT INTO invitation (id, sender_id, recipient_id, party_id) VALUES
                                                                   (1, 1, 2, 1),
                                                                   (2, 2, 3, 2),
                                                                   (3, 3, 4, 3),
                                                                   (4, 4, 5, 4),
                                                                   (5, 5, 1, 5);

-- =========================
-- FOLLOW STATUS
-- =========================
INSERT INTO follow_status (id, name) VALUES
                                         (1, 'ausstehend'),
                                         (2, 'akzeptiert'),
                                         (3, 'blockiert');

-- =========================
-- FOLLOW RELATION
-- =========================
INSERT INTO follow (user1_id, user2_id, status_id) VALUES
                                                       (1, 2, 2),
                                                       (2, 1, 2),
                                                       (3, 1, 1),
                                                       (4, 5, 2),
                                                       (5, 3, 2);