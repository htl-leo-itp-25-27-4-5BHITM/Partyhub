package at.htl.qr;

import at.htl.auth.CurrentUserResolver;
import at.htl.user.User;
import at.htl.user.UserRepository;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import javax.imageio.ImageIO;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import java.time.Instant;
import com.fasterxml.jackson.databind.ObjectMapper;

@Path("/api/qr")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class QrResource {
    @org.eclipse.microprofile.config.inject.ConfigProperty(name="partyhub.qr.enabled", defaultValue="false")
    boolean enabled;

    @Inject
    QrService qrService;

    @Inject
    UserRepository userRepository;

    @Inject
    CurrentUserResolver currentUserResolver;

    @GET
    @Path("/generate")
    @Authenticated
    public Response generate() {
        if (!enabled) return Response.status(404).build();
        try {
            User user = currentUserResolver.requireCurrentUser();

            String payload = "partyhub://login?userId=" + user.getId();

            return Response.ok().entity(new java.util.HashMap<String, String>() {{
                put("userId", user.getId().toString());
                put("username", user.getUsername());
                put("payload", payload);
                put("imageUrl", "/api/qr/image/user/" + user.getId());
            }}).build();
        } catch (Exception e) {
            return Response.status(500).entity(java.util.Map.of("error", "Unable to process QR request")).build();
        }
    }

    @GET
    @Path("/status/{token}")
    public Response status(@jakarta.ws.rs.PathParam("token") @jakarta.validation.constraints.Pattern(regexp="[A-Za-z0-9_-]{1,512}") String token) {
        if (!enabled) return Response.status(404).build();
        var opt = qrService.findByToken(token);
        if (opt.isEmpty()) return Response.status(404).build();
        QrLogin q = opt.get();
        return Response.ok(java.util.Map.of(
                "used", Boolean.toString(q.isUsed()),
                "expiresAt", q.getExpiresAt().toString()
        )).build();
    }

    @GET
    @Path("/image/user/{userId}")
    @Produces("image/png")
    public Response imageByUserId(@jakarta.ws.rs.PathParam("userId") @jakarta.validation.constraints.Positive Long userId) {
        if (!enabled) return Response.status(404).build();
        var optUser = userRepository.findById(userId);
        if (optUser.isEmpty()) return Response.status(404).build();
        
        try {
            String payload = "partyhub://login?userId=" + userId;
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix bm = writer.encode(payload, BarcodeFormat.QR_CODE, 300, 300);
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            com.google.zxing.client.j2se.MatrixToImageWriter.writeToStream(bm, "PNG", baos);
            byte[] bytes = baos.toByteArray();
            return Response.ok(bytes).build();
        } catch (com.google.zxing.WriterException | java.io.IOException e) {
            return Response.serverError().entity(java.util.Map.of("error", "Unable to process QR request")).build();
        }
    }

    @GET
    @Path("/image/{token}")
    @Produces("image/png")
    public Response image(@jakarta.ws.rs.PathParam("token") @jakarta.validation.constraints.Pattern(regexp="[A-Za-z0-9_-]{1,512}") String token) {
        if (!enabled) return Response.status(404).build();
        var opt = qrService.findByToken(token);
        if (opt.isEmpty()) return Response.status(404).build();
        QrLogin q = opt.get();

        try {
            String payload = "partyhub://login?userId=" + q.getUserId();
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix bm = writer.encode(payload, BarcodeFormat.QR_CODE, 300, 300);
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            com.google.zxing.client.j2se.MatrixToImageWriter.writeToStream(bm, "PNG", baos);
            byte[] bytes = baos.toByteArray();
            return Response.ok(bytes).build();
        } catch (com.google.zxing.WriterException | java.io.IOException e) {
            return Response.serverError().entity(java.util.Map.of("error", "Unable to process QR request")).build();
        }
    }

    @POST
    @Path("/exchange")
    public Response exchange(@jakarta.validation.constraints.NotNull java.util.Map<String, Object> body) {
        if (!enabled) return Response.status(404).build();
        if (!(body.get("token") instanceof String token) || !token.matches("[A-Za-z0-9_-]{1,512}"))
            return at.htl.validation.InputExceptionMappers.invalid();

        var opt = qrService.findValidByToken(token);
        if (opt.isEmpty()) return Response.status(404).build();
        QrLogin q = opt.get();

        String mobileToken = qrService.issueMobileToken(q);

        return Response.ok(java.util.Map.of("mobile_token", mobileToken)).build();
    }

    @POST
    @Path("/mobile/me")
    public Response mobileMe(@jakarta.validation.constraints.NotNull java.util.Map<String, Object> body) {
        if (!enabled) return Response.status(404).build();
        if (!(body.get("mobile_token") instanceof String mobileJwt) || mobileJwt.length() > 4096)
            return at.htl.validation.InputExceptionMappers.invalid();

        try {
            // verify HMAC-SHA256 signature using same secret 'secret123'
            String[] parts = mobileJwt.split("\\.");
            if (parts.length != 3) return Response.status(400).build();
            String header = parts[0];
            String payload = parts[1];
            String signature = parts[2];

            String signingInput = header + "." + payload;
            String secret = "secret123";
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] sig = mac.doFinal(signingInput.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            String expected = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(sig);
            if (!java.security.MessageDigest.isEqual(expected.getBytes(), signature.getBytes())) {
                return Response.status(401).build();
            }

            // decode payload
            String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(payload));
            var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> map = mapper.readValue(payloadJson, java.util.Map.class);

            Integer subInt = (Integer) map.get("sub");
            if (subInt == null) return Response.status(400).build();

            long exp = ((Number) map.getOrDefault("exp", 0)).longValue();
            if (Instant.ofEpochSecond(exp).isBefore(Instant.now())) return Response.status(401).build();

            // success: return user id and optionally a JWT for mobile to use as Bearer
            return Response.ok(java.util.Map.of("userId", Long.toString(subInt))).build();
        } catch (java.security.GeneralSecurityException e) {
            return Response.serverError().entity(java.util.Map.of("error", "Unable to process QR request")).build();
        } catch (Exception e) {
            return at.htl.validation.InputExceptionMappers.invalid();
        }
    }
}
