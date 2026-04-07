package at.htl.qr;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.security.SecureRandom;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@ApplicationScoped
public class QrService {

    private static final SecureRandom RANDOM = new SecureRandom();

    @Inject
    QrLoginRepository qrRepo;

    @Transactional
    public QrLogin generateForUser(Long userId) {
        QrLogin q = new QrLogin();
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        q.setToken(token);
        q.setUserId(userId);
        q.setExpiresAt(Instant.now().plus(5, ChronoUnit.MINUTES));
        q.setUsed(false);
        try {
            qrRepo.persist(q);
            return q;
        } catch (Exception e) {
            throw new RuntimeException("Failed to persist QrLogin: " + e.getMessage(), e);
        }
    }

    public Optional<QrLogin> findValidByToken(String token) {
        Optional<QrLogin> opt = qrRepo.findByToken(token);
        if (opt.isEmpty()) return Optional.empty();
        QrLogin q = opt.get();
        if (q.isUsed()) return Optional.empty();
        if (q.getExpiresAt().isBefore(Instant.now())) return Optional.empty();
        return Optional.of(q);
    }

    public Optional<QrLogin> findByToken(String token) {
        return qrRepo.findByToken(token);
    }

    @Transactional
    public String issueMobileToken(QrLogin q) {
        try {
            // create a random jti
            byte[] bytes = new byte[32];
            RANDOM.nextBytes(bytes);
            String jti = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

            long exp = Instant.now().plus(30, ChronoUnit.MINUTES).getEpochSecond();

            String header = Base64.getUrlEncoder().withoutPadding().encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
            String payloadJson = String.format("{\"sub\":\"%d\",\"jti\":\"%s\",\"exp\":%d}", q.getUserId(), jti, exp);
            String payload = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));

            String signingInput = header + "." + payload;

            // Use a server-side secret. For now reuse a stable secret; in production use a proper key from config
            String secret = "secret123";
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] sig = mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8));
            String signature = Base64.getUrlEncoder().withoutPadding().encodeToString(sig);

            String jwt = signingInput + "." + signature;

            q.setMobileToken(jti);
            q.setMobileTokenExpiresAt(Instant.ofEpochSecond(exp));
            q.setUsed(true);
            qrRepo.persist(q);
            return jwt;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
