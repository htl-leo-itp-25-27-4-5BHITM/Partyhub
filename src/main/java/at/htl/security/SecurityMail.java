package at.htl.security;

import java.util.Map;

/**
 * A security mail to send once the transaction that caused it has committed. Security mails
 * ignore the user's notification settings on purpose.
 */
public record SecurityMail(Long userId, String template, String to, String subject, Map<String, Object> data) {
}
