-- =========================
-- RESET
-- =========================
TRUNCATE TABLE
    notification,
    invitation,
    media,
    party_user,
    party,
    qr_login,
    user_location,
    profile_picture,
    follow,
    follow_status,
    location,
    users
RESTART IDENTITY CASCADE;

-- =========================
-- FOLLOW STATUS
-- =========================
INSERT INTO follow_status (id, name) VALUES
    (1, 'pending'),
    (2, 'accepted'),
    (3, 'blocked');

-- =========================
-- USERS
-- =========================
INSERT INTO users (id, username, display_name, distinct_name, email, biography, device_token) VALUES
    (1, 'anna_huber', 'Anna Huber', 'anna_huber', 'anna.huber@partyhub.at', 'Enjoys after-work events, concerts, and rooftop evenings in Linz.', 'MANUAL_TEST_TOKEN_ANNA'),
    (2, 'michael_wagner', 'Michael Wagner', 'michael_wagner', 'michael.wagner@partyhub.at', 'Techno, startups, and spontaneous weekend plans.', NULL),
    (3, 'katrin_bauer', 'Katrin Bauer', 'katrin_bauer', 'katrin.bauer@partyhub.at', 'Loves dance floors, summer parties, and good cocktails.', NULL),
    (4, 'thomas_schneider', 'Thomas Schneider', 'thomas_schneider', 'thomas.schneider@partyhub.at', 'Likes organizing events in Linz and Urfahr.', NULL),
    (5, 'sabine_weber', 'Sabine Weber', 'sabine_weber', 'sabine.weber@partyhub.at', 'Moves between culture, networking, and long nights out.', NULL),
    (6, 'lukas_gruber', 'Lukas Gruber', 'lukas_gruber', 'lukas.gruber@partyhub.at', 'Outdoors during the day, clubs at night.', NULL),
    (7, 'mia_steiner', 'Mia Steiner', 'mia_steiner', 'mia.steiner@partyhub.at', 'Food, art, and relaxed bars by the Danube.', NULL),
    (8, 'david_koenig', 'David Koenig', 'david_koenig', 'david.koenig@partyhub.at', 'Meetups, DJs, and everything around Tabakfabrik.', NULL),
    (10, 'elias_berger', 'Elias Berger', 'elias_berger', 'elias.berger@partyhub.at', 'Photographs events and often hangs out around Hafenviertel.', NULL);

-- =========================
-- PROFILE PICTURE
-- =========================
INSERT INTO profile_picture (id, picture_name, user_id) VALUES
    (1, 'pp_1.jpg', 1),
    (2, 'pp_2.jpg', 2),
    (3, 'pp_3.jpg', 3),
    (4, 'pp_4.jpg', 4),
    (5, 'pp_5.png', 5),
    (6, 'pp_6.jpg', 6),
    (7, 'pp_7.png', 7),
    (8, 'pp_8.jpg', 8),
    (10, 'pp_10.jpg', 10);

-- =========================
-- USER LOCATION
-- =========================
INSERT INTO user_location (id, user_id, longitude, latitude) VALUES
    (1, 1, 14.2862, 48.3064),
    (2, 2, 14.3014, 48.3141),
    (3, 3, 14.2849, 48.3008),
    (4, 4, 14.2708, 48.3060),
    (5, 5, 14.2529, 48.2797),
    (6, 6, 14.2131, 48.2440),
    (7, 7, 14.3373, 48.2850),
    (8, 8, 14.3108, 48.2988),
    (10, 10, 14.2476, 48.3009);

-- =========================
-- LOCATIONS (Linz and surroundings)
-- =========================
INSERT INTO location (id, longitude, latitude, address) VALUES
    (1, 14.2850, 48.3065, 'Hauptplatz Linz'),
    (2, 14.2897, 48.3012, 'Landstrasse Linz'),
    (3, 14.2875, 48.3137, 'Urfahrmarktgelaende, Linz'),
    (4, 14.2938, 48.3053, 'Tabakfabrik Linz'),
    (5, 14.2712, 48.3049, 'Promenade Linz'),
    (6, 14.2651, 48.3212, 'Poestlingberg Linz'),
    (7, 14.2528, 48.2796, 'Leonding Center'),
    (8, 14.2133, 48.2439, 'PlusCity Pasching'),
    (9, 14.2346, 48.2217, 'Traun Castle Park'),
    (10, 14.3371, 48.2851, 'Steyregg Town Center'),
    (11, 14.3107, 48.2989, 'Lentos / Danube Embankment Linz'),
    (12, 14.2804, 48.2991, 'Musiktheater Linz'),
    (13, 14.3058, 48.3205, 'JKU Campus Linz'),
    (14, 14.2478, 48.3007, 'Leonding Rooftop'),
    (15, 14.2974, 48.2874, 'Hafenviertel Linz'),
    (16, 14.251920, 48.268335, 'HTL Leonding'),
    (17, 14.022591, 48.123066, 'Hubingerstrasse 3');

-- =========================
-- PARTIES
-- =========================
INSERT INTO party (
    id,
    host_user_id,
    location_id,
    title,
    theme,
    time_start,
    time_end,
    max_people,
    min_age,
    max_age,
    website,
    description,
    fee,
    created_at,
    visibility
) VALUES
    (1, 1, 1, 'Afterwork at Hauptplatz', 'Afterwork', '2026-05-02 18:30:00', '2026-05-02 23:30:00', 80, 18, 45, 'https://partyhub.local/afterwork-hauptplatz', 'Start casually, meet people, and move on together afterward.', 0.00, '2026-04-25 16:00:00', 'PUBLIC'),
    (2, 2, 4, 'Tabakfabrik Techno Session', 'Techno', '2026-05-03 22:00:00', '2026-05-04 04:30:00', 180, 18, 40, 'https://partyhub.local/tabakfabrik-techno', 'A night with fast sound, fog, and warehouse vibes.', 14.00, '2026-04-26 11:20:00', 'PUBLIC'),
    (3, 3, 11, 'Sunset Beats on the Danube', 'Open-Air', '2026-05-04 17:00:00', '2026-05-04 23:00:00', 150, 18, 38, 'https://partyhub.local/donau-sunset', 'Open-air set right by the Danube with drinks and street food.', 6.00, '2026-04-26 18:40:00', 'PUBLIC'),
    (4, 4, 7, 'Private Birthday in Leonding', 'Birthday', '2026-05-05 19:00:00', '2026-05-06 01:00:00', 35, 18, 40, NULL, 'Small birthday gathering with a playlist and BBQ.', 0.00, '2026-04-27 09:00:00', 'PRIVATE'),
    (5, 5, 12, 'Cocktail Night at Musiktheater', 'Cocktails', '2026-05-06 20:00:00', '2026-05-07 01:30:00', 70, 21, 50, 'https://partyhub.local/musiktheater-cocktails', 'Dress up, good drinks, and relaxed lounge music.', 12.00, '2026-04-27 14:15:00', 'PUBLIC'),
    (6, 6, 8, 'Student Night PlusCity', 'Student', '2026-05-07 20:30:00', '2026-05-08 02:00:00', 120, 18, 30, 'https://partyhub.local/student-pluscity', 'Affordable drinks, lots of movement, and a young crowd.', 5.00, '2026-04-27 19:30:00', 'PUBLIC'),
    (7, 7, 6, 'Poestlingberg Sundowner', 'Chill', '2026-05-08 18:00:00', '2026-05-08 23:00:00', 60, 18, 45, NULL, 'Sunset, picnic blankets, and calm house sound.', 0.00, '2026-04-28 08:10:00', 'PUBLIC'),
    (8, 8, 15, 'Hafenviertel Indie Night', 'Indie', '2026-05-08 21:00:00', '2026-05-09 02:30:00', 90, 18, 39, 'https://partyhub.local/hafen-indie', 'Small stage, live acts, and a late DJ set.', 9.00, '2026-04-28 09:45:00', 'PUBLIC'),
    (10, 10, 13, 'JKU Semester Kickoff', 'Campus', '2026-05-10 19:00:00', '2026-05-11 01:00:00', 200, 18, 32, 'https://partyhub.local/jku-kickoff', 'Semester kickoff with a DJ, photo corner, and many new faces.', 4.00, '2026-04-28 11:00:00', 'PUBLIC'),
    (11, 1, 16, 'Graduation Gala', 'School Party', '2026-06-14 18:00:00', '2026-06-14 23:30:00', 120, 16, 28, 'https://www.htl-leonding.at', 'From classroom to red carpet. We are celebrating our graduation with style, sparkle, and glory. Dress to impress!', 7.50, '2026-04-28 19:59:00', 'PUBLIC'),
    (12, 1, 17, 'Carla''s 18th Birthday', 'Birthday Party','2026-06-14 18:00:00', '2026-06-14 23:30:00', 18, 17,20,'https://partyhub.local/carlaparty','Carla''s Birthday Party', 0.00,'2026-04-25 16:00:00', 'PUBLIC');

-- =========================
-- PARTY ATTENDEES
-- =========================
INSERT INTO party_user (party_id, user_id) VALUES
    (1, 2), (1, 3), (1, 7),
    (2, 1), (2, 5), (2, 8),
    (3, 2), (3, 6), (3, 10),
    (4, 1), (4, 5),
    (5, 3), (5, 7),
    (6, 2), (6, 4), (6, 10),
    (7, 1), (7, 8),
    (8, 3), (8, 6), (8, 10),
    (10, 1), (10, 2), (10, 4), (10, 6),
    (11, 2), (11, 3), (11, 4), (11, 5), (11, 6), (11, 7), (11, 8), (11, 10),
    (12, 1), (12, 2);

-- =========================
-- MEDIA
-- =========================
INSERT INTO media (id, party_id, user_id, file) VALUES
    (1, 1, 1, '/uploads/party1/afterwork_hauptplatz.jpg'),
    (2, 2, 2, '/uploads/party2/2026-04-28T14:28:18.521898Z_testing.jpg'),
    (3, 3, 3, '/uploads/party3/donau_sunset.jpg'),
    (4, 5, 5, '/uploads/party5/cocktail_night.jpg'),
    (5, 8, 8, '/uploads/party8/hafen_indie.jpg'),
    (6, 10, 10, '/uploads/party10/jku_kickoff.jpg');

-- =========================
-- INVITATIONS
-- =========================
INSERT INTO invitation (id, sender_id, recipient_id, party_id, status) VALUES
    (1, 4, 2, 4, 'PENDING'),
    (2, 4, 8, 4, 'PENDING');

-- =========================
-- NOTIFICATIONS
-- =========================
INSERT INTO notification (id, recipient_id, sender_id, party_id, status, created_at, message) VALUES
    (1, 2, 4, 4, 'UNREAD', '2026-04-27 09:05:00', 'Thomas Schneider invited you to the party "Private Birthday in Leonding"'),
    (2, 8, 4, 4, 'READ', '2026-04-27 09:06:00', 'Thomas Schneider invited you to the party "Private Birthday in Leonding"'),
    (5, 7, 5, 5, 'READ', '2026-04-28 12:00:00', '"Cocktail Night at Musiktheater" was updated: Dress up, good drinks, and relaxed lounge music.');

-- =========================
-- FOLLOWS
-- =========================
INSERT INTO follow (user1_id, user2_id, status_id) VALUES
    (1, 2, 2),
    (1, 3, 2),
    (2, 4, 1),
    (3, 5, 2),
    (4, 8, 2),
    (6, 10, 1),
    (7, 1, 2),
    (8, 2, 3),
    (10, 6, 2);

-- =========================
-- QR LOGIN
-- =========================
INSERT INTO qr_login (id, token, userId, expiresAt, used, mobileToken, mobileTokenExpiresAt) VALUES
    (1, 'qr-login-anna-20260501', 1, '2026-05-01 18:00:00+00', false, 'mobile-anna-20260501', '2026-05-01 18:10:00+00'),
    (2, 'qr-login-michael-20260501', 2, '2026-05-01 18:05:00+00', true, 'mobile-michael-20260501', '2026-05-01 18:15:00+00');

-- =========================
-- SEQUENCES RESET
-- =========================
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1), true);
SELECT setval('profile_picture_id_seq', COALESCE((SELECT MAX(id) FROM profile_picture), 1), true);
SELECT setval('user_location_id_seq', COALESCE((SELECT MAX(id) FROM user_location), 1), true);
SELECT setval('location_id_seq', COALESCE((SELECT MAX(id) FROM location), 1), true);
SELECT setval('party_id_seq', COALESCE((SELECT MAX(id) FROM party), 1), true);
SELECT setval('media_id_seq', COALESCE((SELECT MAX(id) FROM media), 1), true);
SELECT setval('invitation_id_seq', COALESCE((SELECT MAX(id) FROM invitation), 1), true);
SELECT setval('notification_id_seq', COALESCE((SELECT MAX(id) FROM notification), 1), true);
SELECT setval('qr_login_id_seq', COALESCE((SELECT MAX(id) FROM qr_login), 1), true);
