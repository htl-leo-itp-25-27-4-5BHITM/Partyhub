-- Import data for PartyHub application
-- Insert data in order to respect foreign key constraints

-- Insert FollowStatus data first
INSERT INTO follow_status (id, name) VALUES (1, 'ausstehend');
INSERT INTO follow_status (id, name) VALUES (2, 'akzeptiert');
INSERT INTO follow_status (id, name) VALUES (3, 'blockiert');


-- Insert User data
INSERT INTO users (id, display_name, distinct_name, email, biography, profile_picture) VALUES
(1, 'Anna Huber', 'anna_h', 'anna.huber@wien.at', 'Party-Enthusiastin und Event-Organisatorin aus Wien!', 'profile_picture1.jpg'),
(2, 'Michael Wagner', 'michi_w', 'michael.wagner@graz.at', 'Liebhaber von geselligen Veranstaltungen und neuen Bekanntschaften', 'profile_picture2.jpg'),
(3, 'Katrin Bauer', 'katrin_b', 'katrin.bauer@salzburg.at', 'Musikliebhaberin und Tanzflächen-Expertin', 'profile_picture3.jpg'),
(4, 'Thomas Schneider', 'thomas_s', 'thomas.schneider@linz.at', 'Professioneller Event-Planer für besondere Momente', 'profile_picture4.jpg'),
(5, 'Sabine Weber', 'sabine_w', 'sabine.weber@innsbruck.at', 'Genießerin und geselliger Schmetterling', 'profile_picture5.jpg');

-- Insert Category data
INSERT INTO category (id, name) VALUES
(1, 'Musik'),
(2, 'Sport'),
(3, 'Kunst'),
(4, 'Essen & Trinken'),
(5, 'Technologie'),
(6, 'Networking'),
(7, 'Wohltätigkeit'),
(8, 'Bildung');

-- Insert Location data
INSERT INTO location (id, longitude, latitude, address) VALUES
(1, 16.3738, 48.2082  , 'Stephansplatz, 1010 Wien, Österreich'),
(2, 16.3680, 48.2020  ,'Hofburg, 1010 Wien, Österreich'),
(3, 16.3850, 48.2150  ,'Praterstern, 1020 Wien, Österreich'),
(4, 16.3600, 48.2000  ,'Linke Wienzeile, 1060 Wien, Österreich'),
(5, 16.3750, 48.2100  ,'Lugeck / Fleischmarkt, 1010 Wien, Österreich');

-- Insert Party data
INSERT INTO party (id, host_user_id, category_id, location_id, title, time_start, time_end, max_people, min_age, max_age, website, description, fee, created_at) VALUES
(1, 1, 1, 1, 'Sommer Musik Festival', '2025-02-13 18:00:00', '2025-02-13 23:00:00', 200, 18, 35, 'https://summermusic.at', 'Begleite uns zu einem fantastischen Sommer-Musik-Festival mit mehreren DJs und Live-Auftritten! Wiener Atmosphäre garantiert.', 25.00, '2024-06-01 10:00:00'),
(2, 2, 4, 2, 'Weinverkostung Abend', '2026-02-15 19:00:00', '2026-02-15 22:00:00', 50, 21, 60, 'https://weinverkostung.at', 'Exklusive Weinverkostung mit Weinen aus aller Welt. Fachkundige Sommelier-Betreuung inklusive. Wiener Weinviertel-Spezialitäten.', 45.00, '2024-06-15 14:30:00'),
(3, 3, 2, 3, 'Beachvolleyball Turnier', '2026-02-14 10:00:00', '2026-02-14 17:00:00', 100, 16, 40, 'https://beachvolley.at', 'Jährliches Beachvolleyball-Turnier am Donaukanal. Teams willkommen, Einzelspieler können bestehende Teams verstärken!', 10.00, '2024-07-01 09:15:00'),
(4, 4, 5, 4, 'Tech Meetup: KI & Zukunft', '2026-02-16 18:30:00', '2026-02-16 21:30:00', 80, 18, 50, 'https://techmeetup.at', 'Diskussion über neueste KI-Technologie und ihre Auswirkungen auf unsere Zukunft. Speaker aus führenden Tech-Unternehmen.', 0.00, '2024-08-01 16:45:00'),
(5, 5, 3, 5, 'Kunstgalerie Eröffnung', '2026-01-17 17:00:00', '2026-01-17 20:00:00', 60, 18, 65, 'https://kunstgalerie.at', 'Eröffnungsabend unserer zeitgenössischen Kunstausstellung mit lokalen und internationalen Künstlern. Wiener Kunstszene hautnah erleben.', 15.00, '2024-09-15 11:20:00');

-- Insert party-user relationships (many-to-many)
INSERT INTO party_user (party_id, user_id) VALUES
(1, 1), (1, 2), (1, 3),
(2, 2), (2, 4), (2, 5),
(3, 3), (3, 1),
(4, 4), (4, 5), (4, 1),
(5, 5), (5, 3), (5, 4);

-- Insert Media data
INSERT INTO media (id, party_id, user_id, url) VALUES
(1, 1, 1, 'profile_picture1.jpg'),
(2, 1, 2, 'profile_picture2.jpg'),
(3, 2, 2, 'profile_picture3.jpg'),
(4, 2, 4, 'profile_picture4.jpg'),
(5, 3, 3, 'profile_picture5.jpg'),
(6, 4, 4, 'default_profile-picture.jpg'),
(7, 5, 5, 'kunstausstellung.jpg'),
(8, 5, 3, 'galerie_innenraum.jpg');

-- Insert Invitation data - Einladungen für Events
INSERT INTO invitation (id, sender_id, recipient_id, party_id) VALUES
(1, 1, 2, 1),  -- Anna lädt Michael zum Musikfestival ein
(2, 1, 5, 1),  -- Anna lädt Sabine zum Musikfestival ein
(3, 2, 3, 2),  -- Michael lädt Katrin zur Weinverkostung ein
(4, 2, 4, 2),  -- Michael lädt Thomas zur Weinverkostung ein
(5, 3, 1, 3),  -- Katrin lädt Anna zum Beachvolleyball ein
(6, 3, 5, 3),  -- Katrin lädt Sabine zum Beachvolleyball ein
(7, 4, 2, 4),  -- Thomas lädt Michael zum Tech Meetup ein
(8, 4, 3, 4),  -- Thomas lädt Katrin zum Tech Meetup ein
(9, 5, 1, 5),  -- Sabine lädt Anna zur Kunsteröffnung ein
(10, 5, 4, 5); -- Sabine lädt Thomas zur Kunsteröffnung ein

-- Insert Follow relationships - Follow-Beziehungen
INSERT INTO follow (user1_id, user2_id, status_id) VALUES
(1, 2, 2),  -- Anna folgt Michael (akzeptiert)
(1, 3, 2),  -- Anna folgt Katrin (akzeptiert)
(2, 1, 2),  -- Michael folgt Anna (akzeptiert)
(2, 4, 2),  -- Michael folgt Thomas (akzeptiert)
(3, 1, 2),  -- Katrin folgt Anna (akzeptiert)
(3, 5, 1),  -- Katrin folgt Sabine (ausstehend)
(4, 2, 2),  -- Thomas folgt Michael (akzeptiert)
(4, 5, 2),  -- Thomas folgt Sabine (akzeptiert)
(5, 3, 2),  -- Sabine folgt Katrin (akzeptiert)
(5, 4, 2);  -- Sabine folgt Thomas (akzeptiert)


-- Setzt Sequenz auf: MAX(id) + 1
SELECT setval(
               pg_get_serial_sequence('location', 'id'),
               (SELECT MAX(id) FROM location),
               true
       );

-- Am Ende des gesamten SQL-Files:
SELECT setval(pg_get_serial_sequence('location', 'id'), COALESCE((SELECT MAX(id) FROM location), 1), true);
SELECT setval(pg_get_serial_sequence('party', 'id'), COALESCE((SELECT MAX(id) FROM party), 1), true);
SELECT setval(pg_get_serial_sequence('user', 'id'), COALESCE((SELECT MAX(id) FROM users), 1), true);
-- etc. für alle Tabellen mit Auto-ID