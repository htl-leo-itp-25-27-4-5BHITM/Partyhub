-- When a follow request was sent, so pending requests can be sorted with other notifications.
-- Nullable: requests from before this migration have no known time. Schema only, no data change.
ALTER TABLE public.follow ADD COLUMN requested_at timestamp(6);
