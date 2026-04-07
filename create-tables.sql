-- Create all tables for PartyHub (based on JPA entities)

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    display_name VARCHAR(255),
    distinct_name VARCHAR(255),
    email VARCHAR(255),
    biography VARCHAR(255)
);

-- Follow Status table
CREATE TABLE IF NOT EXISTS follow_status (
    id BIGINT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- Category table
CREATE TABLE IF NOT EXISTS category (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Location table
CREATE TABLE IF NOT EXISTS location (
    id BIGSERIAL PRIMARY KEY,
    longitude DOUBLE PRECISION,
    latitude DOUBLE PRECISION
);

-- User Location table
CREATE TABLE IF NOT EXISTS user_location (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    longitude DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    PRIMARY KEY (user_id)
);

-- Party table
CREATE TABLE IF NOT EXISTS party (
    id BIGSERIAL PRIMARY KEY,
    host_user_id BIGINT NOT NULL REFERENCES users(id),
    category_id BIGINT REFERENCES category(id),
    location_id BIGINT REFERENCES location(id),
    title VARCHAR(255) NOT NULL,
    time_start TIMESTAMP,
    time_end TIMESTAMP,
    max_people INT,
    min_age INT,
    max_age INT,
    website VARCHAR(500),
    description TEXT,
    fee DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Party-User (join table for many-to-many)
CREATE TABLE IF NOT EXISTS party_user (
    party_id BIGINT NOT NULL REFERENCES party(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (party_id, user_id)
);

-- Media table
CREATE TABLE IF NOT EXISTS media (
    id BIGSERIAL PRIMARY KEY,
    party_id BIGINT NOT NULL REFERENCES party(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file VARCHAR(500) NOT NULL
);

-- Invitation table
CREATE TABLE IF NOT EXISTS invitation (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    party_id BIGINT NOT NULL REFERENCES party(id) ON DELETE CASCADE
);

-- Follow table (friendship)
CREATE TABLE IF NOT EXISTS follow (
    user1_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status_id BIGINT NOT NULL REFERENCES follow_status(id),
    PRIMARY KEY (user1_id, user2_id)
);

-- Profile Picture table
CREATE TABLE IF NOT EXISTS profile_picture (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file VARCHAR(500) NOT NULL
);

-- QR Login table
CREATE TABLE IF NOT EXISTS qr_login (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
