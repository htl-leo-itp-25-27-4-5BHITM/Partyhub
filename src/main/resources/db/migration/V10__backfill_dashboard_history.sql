-- One-time backfill of the host-dashboard history (follow_event, attendance_event) from older
-- notifications, so the dashboard also shows activity from before V9 started recording it.
-- Data only: INSERT ... SELECT, no schema change, no deletion.
--
-- The message text only decides the kind of event; users and party come from the structured
-- columns. Notification texts are fixed templates (English, older ones German):
--   FollowRepository.notifyFollowAccepted  "<follower> follows you now."            (since 2026-05-13)
--   PartyRepository.notifyHost             "<guest> accepted your invitation to the party "<title>"."
--                                          "<guest> hat deine Einladung zur Party "<title>" angenommen."
--                                          "<guest> left the party "<title>"."
--                                          "<guest> hat die Party "<title>" verlassen."
--   InvitationRepository.acceptInvite      "<guest> accepted your invitation to the party "<title>""
-- Events recorded live since V9 are written in the same transaction as their notification, so a
-- notification with a matching event within 60 seconds is skipped. Activity without one of these
-- notifications (unfollows, joins to public parties without an invitation, deleted notifications)
-- stays without history; nothing is estimated.

-- Accepted follows: sender started following the recipient.
INSERT INTO public.follow_event (follower_id, followed_id, type, occurred_at)
SELECT DISTINCT n.sender_id, n.recipient_id, 'FOLLOWED', date_trunc('second', n.created_at)
FROM public.notification n
WHERE n.party_id IS NULL
  AND n.sender_id <> n.recipient_id
  AND n.message LIKE '% follows you now.'
  AND NOT EXISTS (
      SELECT 1 FROM public.follow_event e
      WHERE e.follower_id = n.sender_id
        AND e.followed_id = n.recipient_id
        AND e.type = 'FOLLOWED'
        AND e.occurred_at BETWEEN n.created_at - INTERVAL '60 seconds' AND n.created_at + INTERVAL '60 seconds');

-- Accepted invitations: the guest (sender) joined the host's (recipient's) party.
INSERT INTO public.attendance_event (party_id, user_id, type, occurred_at)
SELECT DISTINCT n.party_id, n.sender_id, 'JOINED', date_trunc('second', n.created_at)
FROM public.notification n
JOIN public.party p ON p.id = n.party_id
WHERE p.host_user_id = n.recipient_id
  AND n.sender_id <> n.recipient_id
  AND (n.message LIKE '% accepted your invitation to the party "%'
       OR n.message LIKE '% hat deine Einladung zur Party "%" angenommen.')
  AND NOT EXISTS (
      SELECT 1 FROM public.attendance_event e
      WHERE e.party_id = n.party_id
        AND e.user_id = n.sender_id
        AND e.type = 'JOINED'
        AND e.occurred_at BETWEEN n.created_at - INTERVAL '60 seconds' AND n.created_at + INTERVAL '60 seconds');

-- Left parties: the guest (sender) left the host's (recipient's) party.
INSERT INTO public.attendance_event (party_id, user_id, type, occurred_at)
SELECT DISTINCT n.party_id, n.sender_id, 'LEFT', date_trunc('second', n.created_at)
FROM public.notification n
JOIN public.party p ON p.id = n.party_id
WHERE p.host_user_id = n.recipient_id
  AND n.sender_id <> n.recipient_id
  AND (n.message LIKE '% left the party "%'
       OR n.message LIKE '% hat die Party "%" verlassen.')
  AND NOT EXISTS (
      SELECT 1 FROM public.attendance_event e
      WHERE e.party_id = n.party_id
        AND e.user_id = n.sender_id
        AND e.type = 'LEFT'
        AND e.occurred_at BETWEEN n.created_at - INTERVAL '60 seconds' AND n.created_at + INTERVAL '60 seconds');
