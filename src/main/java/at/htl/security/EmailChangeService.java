package at.htl.security;

import at.htl.user.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.Response.Status;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Confirmed e-mail change: the new address gets a single-use link, the old address a
 * "this wasn't me" notice, and only the link switches the Keycloak and PartyHub e-mail.
 */
@ApplicationScoped
public class EmailChangeService {

    static final Duration LINK_LIFETIME = Duration.ofHours(24);
    static final int MAX_ATTEMPTS_PER_HOUR = 5;
    private static final DateTimeFormatter MAIL_TIME = DateTimeFormatter
            .ofPattern("d MMMM yyyy, HH:mm", Locale.ENGLISH).withZone(ZoneId.of("Europe/Vienna"));

    @Inject
    EntityManager em;

    @Inject
    KeycloakAccountService keycloak;

    @Inject
    Event<SecurityMail> mails;

    @Inject
    Logger logger;

    @ConfigProperty(name = "partyhub.web.url", defaultValue = "http://localhost:8080")
    String webUrl;

    @ConfigProperty(name = "partyhub.notifications.email.from", defaultValue = "noreply@partyhub.at")
    String supportEmail;

    public record Pending(String newEmail, OffsetDateTime createdAt, OffsetDateTime expiresAt) {
    }

    public Optional<Pending> pending(Long userId) {
        return findByUser(userId)
                .filter(request -> request.getExpiresAt().isAfter(OffsetDateTime.now()))
                .map(request -> new Pending(request.getNewEmail(), request.getCreatedAt(), request.getExpiresAt()));
    }

    @Transactional
    public Pending request(User caller, String requestedEmail, String userAgent) {
        User user = em.find(User.class, caller.getId());
        String newEmail = requestedEmail.trim();
        if (user.getEmail() != null && newEmail.equalsIgnoreCase(user.getEmail().trim())) {
            throw new EmailChangeProblem(Status.BAD_REQUEST, "SAME_EMAIL",
                    "This is already your e-mail address", "newEmail");
        }
        enforceRateLimit(user.getId());
        if (emailTaken(newEmail, user)) {
            throw new EmailChangeProblem(Status.CONFLICT, "EMAIL_TAKEN",
                    "This e-mail address is already used by another account", "newEmail");
        }

        // A new request replaces the old one, so the old links stop working.
        findByUser(user.getId()).ifPresent(old -> {
            em.remove(old);
            em.flush();
        });

        OffsetDateTime now = OffsetDateTime.now();
        String confirmToken = SecurityTokens.newToken();
        String cancelToken = SecurityTokens.newToken();
        EmailChangeRequest request = new EmailChangeRequest();
        request.setUser(user);
        request.setNewEmail(newEmail);
        request.setConfirmTokenHash(SecurityTokens.hash(confirmToken));
        request.setCancelTokenHash(SecurityTokens.hash(cancelToken));
        request.setCreatedAt(now);
        request.setExpiresAt(now.plus(LINK_LIFETIME));
        request.setUserAgent(userAgent == null ? null : userAgent.substring(0, Math.min(userAgent.length(), 255)));
        em.persist(request);
        em.persist(new EmailChangeAttempt(user.getId(), now));

        sendConfirmation(user, newEmail, confirmToken);
        Map<String, Object> notice = baseData(user);
        notice.put("maskedNewEmail", SecurityTokens.maskEmail(newEmail));
        notice.put("requestedAt", MAIL_TIME.format(now));
        notice.put("device", UserAgentSummary.of(userAgent));
        notice.put("notMeUrl", webUrl + "/settings/email-confirm.html#cancel=" + cancelToken);
        mails.fire(new SecurityMail(user.getId(), "email-change-requested", user.getEmail(),
                "PartyHub: someone asked to change your e-mail address", notice));
        logger.infof("E-mail change requested for user %s", user.getId());
        return new Pending(newEmail, request.getCreatedAt(), request.getExpiresAt());
    }

    @Transactional
    public Pending resend(User caller) {
        EmailChangeRequest request = findByUser(caller.getId())
                .filter(r -> r.getExpiresAt().isAfter(OffsetDateTime.now()))
                .orElseThrow(() -> new EmailChangeProblem(Status.NOT_FOUND, "NO_PENDING_CHANGE",
                        "There is no pending e-mail change"));
        enforceRateLimit(caller.getId());
        String confirmToken = SecurityTokens.newToken();
        OffsetDateTime now = OffsetDateTime.now();
        request.setConfirmTokenHash(SecurityTokens.hash(confirmToken));
        request.setExpiresAt(now.plus(LINK_LIFETIME));
        em.persist(new EmailChangeAttempt(caller.getId(), now));
        sendConfirmation(request.getUser(), request.getNewEmail(), confirmToken);
        return new Pending(request.getNewEmail(), request.getCreatedAt(), request.getExpiresAt());
    }

    @Transactional
    public void cancel(User caller) {
        findByUser(caller.getId()).ifPresent(em::remove);
    }

    /** Activates the new address. Keycloak is updated first; if that fails nothing changes. */
    @Transactional
    public void confirm(String token) {
        EmailChangeRequest request = findValid(CONFIRM_LINK, token);
        User user = request.getUser();
        String oldEmail = user.getEmail();
        String newEmail = request.getNewEmail();
        if (emailTaken(newEmail, user)) {
            throw new EmailChangeProblem(Status.CONFLICT, "EMAIL_TAKEN",
                    "This e-mail address is no longer available");
        }
        if (user.getKeycloakId() != null) {
            try {
                keycloak.updateEmail(user.getKeycloakId(), newEmail);
            } catch (KeycloakAccountService.KeycloakUnavailableException e) {
                throw new EmailChangeProblem(Status.SERVICE_UNAVAILABLE, "TEMPORARY_ERROR",
                        "Your e-mail could not be changed right now. Please try the link again later.");
            }
        }
        OffsetDateTime now = OffsetDateTime.now();
        user.setEmail(newEmail);
        user.setEmailChangedAt(now);
        em.remove(request);

        Map<String, Object> done = baseData(user);
        done.put("newEmail", newEmail);
        mails.fire(new SecurityMail(user.getId(), "email-change-done-new", newEmail,
                "PartyHub: your e-mail address was changed", done));
        Map<String, Object> old = baseData(user);
        old.put("maskedNewEmail", SecurityTokens.maskEmail(newEmail));
        old.put("changedAt", MAIL_TIME.format(now));
        mails.fire(new SecurityMail(user.getId(), "email-change-done-old", oldEmail,
                "PartyHub: the e-mail of your account was changed", old));
        logger.infof("E-mail change confirmed for user %s", user.getId());
    }

    /** "This wasn't me": ends the pending change and returns Keycloak's password reset page. */
    @Transactional
    public String reportNotMe(String token) {
        EmailChangeRequest request = findValid(CANCEL_LINK, token);
        logger.infof("E-mail change for user %s cancelled from the old address", request.getUser().getId());
        em.remove(request);
        return keycloak.passwordResetUrl();
    }

    private static final String CONFIRM_LINK = "SELECT r FROM EmailChangeRequest r WHERE r.confirmTokenHash = :hash";
    private static final String CANCEL_LINK = "SELECT r FROM EmailChangeRequest r WHERE r.cancelTokenHash = :hash";

    private EmailChangeRequest findValid(String query, String token) {
        if (token == null || token.isBlank() || token.length() > 128) {
            throw invalidLink();
        }
        EmailChangeRequest request = em.createQuery(query, EmailChangeRequest.class)
                .setParameter("hash", SecurityTokens.hash(token))
                .getResultStream().findFirst()
                .orElseThrow(EmailChangeService::invalidLink);
        if (!request.getExpiresAt().isAfter(OffsetDateTime.now())) {
            throw new EmailChangeProblem(Status.GONE, "LINK_EXPIRED", "This link has expired");
        }
        return request;
    }

    private static EmailChangeProblem invalidLink() {
        return new EmailChangeProblem(Status.GONE, "LINK_INVALID", "This link is no longer valid");
    }

    private void sendConfirmation(User user, String newEmail, String confirmToken) {
        Map<String, Object> data = baseData(user);
        data.put("newEmail", newEmail);
        data.put("confirmUrl", webUrl + "/settings/email-confirm.html#token=" + confirmToken);
        data.put("validHours", LINK_LIFETIME.toHours());
        mails.fire(new SecurityMail(user.getId(), "email-change-confirm", newEmail,
                "PartyHub: confirm your new e-mail address", data));
    }

    private Map<String, Object> baseData(User user) {
        Map<String, Object> data = new HashMap<>();
        data.put("displayName", user.getDisplayName() != null && !user.getDisplayName().isBlank()
                ? user.getDisplayName() : user.getDistinctName());
        data.put("siteUrl", webUrl);
        data.put("resetUrl", keycloak.passwordResetUrl());
        data.put("supportEmail", supportEmail);
        return data;
    }

    private void enforceRateLimit(Long userId) {
        long recent = em.createQuery(
                        "SELECT COUNT(a) FROM EmailChangeAttempt a WHERE a.userId = :userId AND a.attemptedAt > :since", Long.class)
                .setParameter("userId", userId)
                .setParameter("since", OffsetDateTime.now().minusHours(1))
                .getSingleResult();
        if (recent >= MAX_ATTEMPTS_PER_HOUR) {
            throw new EmailChangeProblem(Status.TOO_MANY_REQUESTS, "RATE_LIMITED",
                    "Too many e-mail change requests. Please try again later.");
        }
    }

    private boolean emailTaken(String email, User owner) {
        long local = em.createQuery(
                        "SELECT COUNT(u) FROM User u WHERE LOWER(u.email) = :email AND u.id <> :id", Long.class)
                .setParameter("email", email.toLowerCase(Locale.ROOT))
                .setParameter("id", owner.getId())
                .getSingleResult();
        if (local > 0) {
            return true;
        }
        try {
            return keycloak.emailUsedByOtherAccount(email, owner.getKeycloakId());
        } catch (KeycloakAccountService.KeycloakUnavailableException e) {
            throw new EmailChangeProblem(Status.SERVICE_UNAVAILABLE, "TEMPORARY_ERROR",
                    "E-mail changes are not available right now. Please try again later.");
        }
    }

    private Optional<EmailChangeRequest> findByUser(Long userId) {
        return em.createQuery("SELECT r FROM EmailChangeRequest r WHERE r.user.id = :userId", EmailChangeRequest.class)
                .setParameter("userId", userId)
                .getResultStream().findFirst();
    }
}
