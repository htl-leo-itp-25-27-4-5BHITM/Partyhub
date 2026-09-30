-- Replaces the startup DDL that the notification schema-compatibility bean used to run.
-- Idempotent: the school cloud already received these changes at startup,
-- while a fresh V1 database has not.

-- Notifications (e.g. follow events) can exist without a party
ALTER TABLE public.notification ALTER COLUMN party_id DROP NOT NULL;

-- Invitations carry a status, defaulting to PENDING
ALTER TABLE public.invitation ADD COLUMN IF NOT EXISTS status character varying(255);
UPDATE public.invitation SET status = 'PENDING' WHERE status IS NULL;
ALTER TABLE public.invitation ALTER COLUMN status SET DEFAULT 'PENDING';
ALTER TABLE public.invitation ALTER COLUMN status SET NOT NULL;
