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

INSERT INTO party (host_user_id, category_id, time_start, time_end, max_people, min_age, max_age, title, description) VALUES
(1, 1, '2025-12-01 18:00:00', '2025-12-01 23:00:00', 100, 18, 50, 'Milestone Bash: Celebrate in Style', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc eget ultricies tincidunt, velit velit bibendum velit, vel bibendum velit velit sit amet velit.'),
(2, 2, '2025-12-15 15:00:00', '2025-12-15 20:00:00', 50, 21, 60, 'Forever United: A Romantic Wedding Celebration', 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'),
(3, 3, '2025-11-30 09:00:00', '2025-11-30 17:00:00', 200, 25, 45, 'Tech Innovators Annual Conference', 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.'),
(4, 4, '2025-11-25 12:00:00', '2025-11-25 22:00:00', 150, 16, 30, 'Rhythm & Beats Music Festival', 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.'),
(5, 5, '2025-10-20 14:00:00', '2025-10-20 19:00:00', 80, 18, 40, 'Urban Perspectives Art Showcase', 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem.'),
(1, 1, '2025-12-10 19:00:00', '2025-12-10 22:00:00', 75, 21, 45, 'Roaring 30s Surprise Party', 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.'),
(1, 2, '2025-12-20 16:00:00', '2025-12-20 21:00:00', 100, 25, 55, 'Coastal Dream Wedding', 'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam.'),
(2, 3, '2025-11-15 10:00:00', '2025-11-15 16:00:00', 250, 30, 50, 'Global Business Leadership Summit', 'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit.');


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

INSERT INTO party_media (party_id, user_id, url) VALUES
                                                     (1, 1, 'http://example.com/images/party1.jpg'),
                                                     (2, 2, 'http://example.com/images/party2.jpg'),
                                                     (3, 3, 'http://example.com/images/party3.jpg'),
                                                     (4, 4, 'http://example.com/images/party4.jpg'),
                                                     (5, 5, 'http://example.com/images/party5.jpg');

INSERT INTO gallery (media_id) VALUES
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
