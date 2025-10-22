INSERT INTO userAccount (name, email) VALUES
                                          ('Alice Smith', 'alice@example.com'),
                                          ('Bob Johnson', 'bob@example.com'),
                                          ('Charlie Brown', 'charlie@example.com'),
                                          ('Diana Prince', 'diana@example.com'),
                                          ('Evan White', 'evan@example.com');

-- Insert sample categories into Category
INSERT INTO Category (category_name) VALUES
                                         ('Birthday'),
                                         ('Wedding'),
                                         ('Networking'),
                                         ('Concert'),
                                         ('Fundraiser');

INSERT INTO Party (host_user_id, category_id, time_start, time_end, max_people, min_age, max_age) VALUES
                                                                                                      (1, 1, '2025-10-24 18:00:00', '2025-10-24 23:00:00', 50, 18, 30),
                                                                                                      (2, 2, '2025-11-01 15:00:00', '2025-11-01 22:00:00', 100, 21, 50),
                                                                                                      (3, 3, '2025-11-15 20:00:00', '2025-11-15 23:30:00', 30, 18, 40),
                                                                                                      (4, 4, '2025-12-10 19:00:00', '2025-12-10 21:00:00', 60, 15, 35),
                                                                                                      (5, 5, '2025-12-20 17:00:00', '2025-12-20 21:00:00', 80, 18, 45);

INSERT INTO Post (user_id, party_id, content) VALUES
                                                  (1, 1, 'Excited for my birthday party!'),
                                                  (2, 2, 'Cant wait for the wedding event!'),
(3, 3, 'Networking event coming up soon!'),
(4, 4, 'Join me for an amazing concert!'),
(5, 5, 'Let’s make a difference at the fundraiser!');

INSERT INTO UserPartyMapping (party_id, user_id) VALUES
(1, 2),
(1, 3),
(2, 1),
(2, 5),
(3, 4),
(4, 1),
(5, 3);

INSERT INTO PartyLocation (party_id, longitude, latitude) VALUES
(1, -73.935242, 40.730610),
(2, -74.006015, 40.712776),
(3, -118.243683, 34.052235),
(4, -95.369804, 29.760427),
(5, -122.419418, 37.774929);

INSERT INTO PartyImage (party_id, user_id, url) VALUES
(1, 1, 'http://example.com/image1.jpg'),
(2, 2, 'http://example.com/image2.jpg'),
(3, 3, 'http://example.com/image3.jpg'),
(4, 4, 'http://example.com/image4.jpg'),
(5, 5, 'http://example.com/image5.jpg');

INSERT INTO Gallery (img_id) VALUES
(1),
(2),
(3),
(4),
(5);

INSERT INTO BlockedUsers (blocker_id, blocked_id) VALUES
(1, 2),
(2, 3),
(3, 4),
(4, 5),
(5, 1);

INSERT INTO Friendship (user1_id, user2_id, status) VALUES
(1, 2, 'accepted'),
(2, 3, 'pending'),
(3, 4, 'accepted'),
(1, 3, 'declined'),
(2, 4, 'accepted');
