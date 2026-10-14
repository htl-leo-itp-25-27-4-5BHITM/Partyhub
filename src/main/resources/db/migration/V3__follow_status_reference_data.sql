-- Follow-status reference data, previously created by startup code.
-- Insert-only: existing rows are left unchanged.
INSERT INTO follow_status (id, name) VALUES
    (1, 'pending'),
    (2, 'accepted'),
    (3, 'blocked')
ON CONFLICT (id) DO NOTHING;
