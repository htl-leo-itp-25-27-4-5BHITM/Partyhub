package at.htl.validation;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.Set;
import java.time.LocalDateTime;
import org.owasp.encoder.Encode;

@QuarkusTest
public class ValidationDemoTest {

    @Inject
    Validator validator;

    @Test
    void demo_SafeTextValidator_rejectsSqlInjection() {
        SafeTextValidator val = new SafeTextValidator();

        assertFalse(val.isValid("'; DROP TABLE users; --", null));
        assertFalse(val.isValid("admin' OR '1'='1", null));
        assertFalse(val.isValid("<script>alert('xss')</script>", null));

        assertTrue(val.isValid("Normal party name", null));
        assertTrue(val.isValid("Party 2026!", null));
    }

    @Test
    void demo_ValidPartyNameValidator() {
        ValidPartyNameValidator val = new ValidPartyNameValidator();

        assertTrue(val.isValid("Summer Party 2026", null));
        assertTrue(val.isValid("Mike's Birthday", null));

        assertFalse(val.isValid("", null));
        assertFalse(val.isValid("a", null));
        assertFalse(val.isValid(new String(new char[101]).replace('\0', 'x'), null));
    }

    @Test
    void demo_NoHtmlValidator() {
        NoHtmlValidator val = new NoHtmlValidator();

        assertTrue(val.isValid("Just text here", null));
        assertTrue(val.isValid("Party at 123 Main St.", null));

        assertFalse(val.isValid("<script>alert('xss')</script>", null));
        assertFalse(val.isValid("<b>Bold text</b>", null));
        assertFalse(val.isValid("Text &amp; more", null));
    }

    @Test
    void demo_PartyCreateDto_validation() {
        var dto = new at.htl.party.PartyCreateDto(
            "'; DROP TABLE parties; --",
            "A party",
            10.0,
            LocalDateTime.now().plusDays(1),
            LocalDateTime.now().plusDays(2),
            100, 18, 30,
            "http://example.com",
            40.0, -74.0,
            "123 Main St",
            "summer", "public",
            null
        );

        Set<ConstraintViolation<at.htl.party.PartyCreateDto>> violations = validator.validate(dto);
        assertFalse(violations.isEmpty(), "Should have validation errors");
        System.out.println("Validation errors for malicious input:");
        violations.forEach(v -> System.out.println("  - " + v.getPropertyPath() + ": " + v.getMessage()));
    }

    @Test
    void demo_validPartyCreateDto_passes() {
        var dto = new at.htl.party.PartyCreateDto(
            "Summer Beach Party",
            "A fun party at the beach",
            25.0,
            LocalDateTime.of(2026, 6, 15, 18, 0),
            LocalDateTime.of(2026, 6, 15, 23, 0),
            200, 18, 50,
            "https://example.com/beach-party",
            40.7128, -74.0060,
            "Coney Island Beach",
            "summer", "public",
            null
        );

        Set<ConstraintViolation<at.htl.party.PartyCreateDto>> violations = validator.validate(dto);
        assertTrue(violations.isEmpty(), "Valid DTO should pass: " + violations);
    }

    @Test
    void demo_OwaspEncoder_outputEncoding() {
        String userInput = "<script>alert('stolen')</script>";
        String safeHtml = Encode.forHtml(userInput);
        System.out.println("Original: " + userInput);
        System.out.println("Encoded for HTML: " + safeHtml);
        assertFalse(safeHtml.contains("<script>"));

        String safeJson = Encode.forJavaScript(userInput);
        System.out.println("Encoded for JS: " + safeJson);
    }
}
