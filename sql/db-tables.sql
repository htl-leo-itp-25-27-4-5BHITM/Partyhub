DROP TABLE IF EXISTS UserAccount CASCADE;
DROP TABLE IF EXISTS Party CASCADE;
DROP TABLE IF EXISTS Post CASCADE;
DROP TABLE IF EXISTS Category CASCADE;
DROP TABLE IF EXISTS PartySignup CASCADE;
DROP TABLE IF EXISTS PartyLocation CASCADE;
DROP TABLE IF EXISTS Gallery CASCADE;
DROP TABLE IF EXISTS PartyImage CASCADE;

CREATE TABLE UserAccount (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE Category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL
);

CREATE TABLE Party (
    party_id SERIAL PRIMARY KEY,
    host_user_id INT NOT NULL,
    category_id INT NOT NULL,
    time_start TIMESTAMP NOT NULL,
    time_end TIMESTAMP NOT NULL,
    max_people INT NOT NULL,
    min_age INT NOT NULL,
    max_age INT NOT NULL,
    FOREIGN KEY (host_user_id) REFERENCES UserAccount (user_id),
    FOREIGN KEY (category_id) REFERENCES Category(category_id)
);

CREATE TABLE Post (
    post_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    party_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES UserAccount (user_id),
    FOREIGN KEY (party_id) REFERENCES Party(party_id)
);

CREATE TABLE PartySignup (
    party_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (party_id, user_id),
    FOREIGN KEY (party_id) REFERENCES Party(party_id),
    FOREIGN KEY (user_id) REFERENCES UserAccount (user_id)
);

CREATE TABLE PartyLocation (
    party_id INT NOT NULL PRIMARY KEY,
    longitude FLOAT NOT NULL,
    latitude FLOAT NOT NULL,
    location_name TEXT,
    FOREIGN KEY (party_id) REFERENCES Party(party_id)
);

CREATE TABLE PartyImage (
    img_id SERIAL PRIMARY KEY,
    party_id INT NOT NULL,
    user_id INT NOT NULL,
    url VARCHAR(255) NOT NULL,
    FOREIGN KEY (party_id) REFERENCES Party(party_id),
    FOREIGN KEY (user_id) REFERENCES UserAccount (user_id)
);

CREATE TABLE Gallery (
    gallery_id SERIAL PRIMARY KEY,
    img_id INT NOT NULL,
    FOREIGN KEY (img_id) REFERENCES PartyImage(img_id)
);

CREATE TABLE BlockedUsers (
    blocker_id INT NOT NULL,
    blocked_id INT NOT NULL,
    PRIMARY KEY (blocker_id, blocked_id),
    FOREIGN KEY (blocker_id) REFERENCES UserAccount (user_id),
    FOREIGN KEY (blocked_id) REFERENCES UserAccount (user_id)
);

CREATE TABLE Friendship (
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    PRIMARY KEY (user1_id, user2_id),
    FOREIGN KEY (user1_id) REFERENCES UserAccount (user_id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES UserAccount (user_id)
);

