-- Align persisted text widths with the public DTO limits; no values are rewritten.
ALTER TABLE users ALTER COLUMN biography TYPE varchar(2000);
ALTER TABLE party ALTER COLUMN description TYPE varchar(2000);
ALTER TABLE party ALTER COLUMN website TYPE varchar(500);
ALTER TABLE location ALTER COLUMN address TYPE varchar(500);
