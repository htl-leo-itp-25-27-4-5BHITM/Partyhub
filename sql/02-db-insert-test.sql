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

INSERT INTO party (host_user_id, category_id, time_start, time_end, max_people, min_age, max_age) VALUES
                                                                                                      (1, 1, '2025-12-01 18:00:00', '2025-12-01 23:00:00', 100, 18, 50),
                                                                                                      (2, 2, '2025-12-15 15:00:00', '2025-12-15 20:00:00', 50, 21, 60),
                                                                                                      (3, 3, '2025-11-30 09:00:00', '2025-11-30 17:00:00', 200, 25, 45),
                                                                                                      (4, 4, '2025-11-25 12:00:00', '2025-11-25 22:00:00', 150, 16, 30),
                                                                                                      (5, 5, '2025-10-20 14:00:00', '2025-10-20 19:00:00', 80, 18, 40);

INSERT INTO post (user_id, party_id, content) VALUES
                                                  (1, 1, 'Excited for the birthday party!'),
                                                  (2, 2, 'Looking forward to the wedding!'),
                                                  (3, 3, 'Can''t wait for the corporate event.'),
                                                  (4, 4, 'Music festival is going to be epic!'),
                                                  (5, 5, 'Art exhibition tomorrow, hope to see you all!');

INSERT INTO  party_attendees (party_id, user_id) VALUES
                                                    (1, 2),
                                                    (1, 3),
                                                    (2, 1),
                                                    (3, 4),
                                                    (4, 1),
                                                    (5, 3);

INSERT INTO party_location (party_id, longitude, latitude) VALUES
                                                                              (1, -123.3656, 48.4284),
                                                                              (2, -122.4194, 37.7749),
                                                                              (3, -104.9903, 39.7392),
                                                                              (4, -73.9857, 40.7484),
                                                                              (5, -0.1276, 51.5074);

INSERT INTO party_image (party_id, user_id, url) VALUES
                                                     (1, 1, 'http://example.com/images/party1.jpg'),
                                                     (2, 2, 'http://example.com/images/party2.jpg'),
                                                     (3, 3, 'http://example.com/images/party3.jpg'),
                                                     (4, 4, 'http://example.com/images/party4.jpg'),
                                                     (5, 5, 'http://example.com/images/party5.jpg');

INSERT INTO gallery (img_id) VALUES
                                 (1),
                                 (2),
                                 (3),
                                 (4),
                                 (5);

INSERT INTO blocked_users (blocker_id, blocked_id) VALUES
                                                       (1, 2),
                                                       (2, 3),
                                                       (3, 1),
                                                       (4, 5);

INSERT INTO friendship (user1_id, user2_id, status) VALUES
                                                        (1, 2, 'friends'),
                                                        (2, 3, 'pending'),
                                                        (1, 3, 'blocked'),
                                                        (4, 5, 'friends');
