CREATE SEQUENCE user_account_id_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE category_id_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE party_id_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE post_id_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE img_id_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE user_account (
                              user_id INT PRIMARY KEY DEFAULT nextval('user_account_id_seq'),
                              name VARCHAR(100) NOT NULL,
                              email VARCHAR(100) UNIQUE NOT NULL
);


CREATE TABLE category (
                          category_id INT PRIMARY KEY DEFAULT nextval('category_id_seq'),
                          category_name VARCHAR(50) NOT NULL
);

CREATE TABLE party (
                       party_id INT PRIMARY KEY DEFAULT nextval('party_id_seq'),
                       host_user_id INT NOT NULL,
                       category_id INT NOT NULL,
                       time_start TIMESTAMP NOT NULL,
                       time_end TIMESTAMP NOT NULL,
                       max_people INT NOT NULL,
                       min_age INT NOT NULL,
                       max_age INT NOT NULL,
                       FOREIGN KEY (host_user_id) REFERENCES user_account (user_id),
                       FOREIGN KEY (category_id) REFERENCES category(category_id)
);

CREATE TABLE post (
                      post_id INT PRIMARY KEY DEFAULT nextval('post_id_seq'),
                      user_id INT NOT NULL,
                      party_id INT NOT NULL,
                      content TEXT NOT NULL,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      FOREIGN KEY (user_id) REFERENCES user_account (user_id),
                      FOREIGN KEY (party_id) REFERENCES party(party_id)
);

CREATE TABLE party_attendees (
                                 party_id INT NOT NULL,
                                 user_id INT NOT NULL,
                                 PRIMARY KEY (party_id, user_id),
                                 FOREIGN KEY (party_id) REFERENCES party(party_id),
                                 FOREIGN KEY (user_id) REFERENCES user_account (user_id)
);

CREATE TABLE party_location (
                                party_id INT NOT NULL PRIMARY KEY,
                                longitude FLOAT NOT NULL,
                                latitude FLOAT NOT NULL,
                                location_name TEXT,
                                FOREIGN KEY (party_id) REFERENCES party(party_id)
);

CREATE TABLE party_image (
                             img_id INT PRIMARY KEY DEFAULT nextval('img_id_seq'),
                             party_id INT NOT NULL,
                             user_id INT NOT NULL,
                             url VARCHAR(255) NOT NULL,
                             FOREIGN KEY (party_id) REFERENCES party(party_id),
                             FOREIGN KEY (user_id) REFERENCES user_account (user_id)
);

CREATE TABLE gallery (
                         gallery_id INT PRIMARY KEY DEFAULT nextval('img_id_seq'),
                         img_id INT NOT NULL,
                         FOREIGN KEY (img_id) REFERENCES party_image(img_id)
);

CREATE TABLE blocked_users (
                               blocker_id INT NOT NULL,
                               blocked_id INT NOT NULL,
                               PRIMARY KEY (blocker_id, blocked_id),
                               FOREIGN KEY (blocker_id) REFERENCES user_account (user_id),
                               FOREIGN KEY (blocked_id) REFERENCES user_account (user_id)
);
CREATE TABLE friendship (
                            user1_id INT NOT NULL,
                            user2_id INT NOT NULL,
                            status VARCHAR(20) NOT NULL,
                            PRIMARY KEY (user1_id, user2_id),
                            FOREIGN KEY (user1_id) REFERENCES user_account (user_id) ON DELETE CASCADE,
                            FOREIGN KEY (user2_id) REFERENCES user_account (user_id)
);
