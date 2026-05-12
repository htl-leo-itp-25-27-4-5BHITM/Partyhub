package at.htl.validation;

import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class SafeTextValidatorTest {

    private final SafeTextValidator validator = new SafeTextValidator();

    @Test
    void testNullValue() {
        assertTrue(validator.isValid(null, null));
    }

    @Test
    void testBlankValue() {
        assertTrue(validator.isValid("   ", null));
    }

    @Test
    void testSafeText() {
        assertTrue(validator.isValid("Hello World", null));
        assertTrue(validator.isValid("Party at 8pm!", null));
        assertTrue(validator.isValid("user@email.com", null));
    }

    @Test
    void testSqlInjectionUnion() {
        assertFalse(validator.isValid("SELECT * FROM users UNION SELECT * FROM parties", null));
        assertFalse(validator.isValid("UNION SELECT password FROM admin", null));
    }

    @Test
    void testSqlInjectionSelect() {
        assertFalse(validator.isValid("'; SELECT * FROM users --", null));
    }

    @Test
    void testSqlInjectionDrop() {
        assertFalse(validator.isValid("test'; DROP TABLE users; --", null));
    }

    @Test
    void testSqlInjectionInsert() {
        assertFalse(validator.isValid("'; INSERT INTO users VALUES ('hacker') --", null));
    }

    @Test
    void testSqlInjectionUpdate() {
        assertFalse(validator.isValid("'; UPDATE users SET admin=1 --", null));
    }

    @Test
    void testSqlInjectionDelete() {
        assertFalse(validator.isValid("'; DELETE FROM parties --", null));
    }

    @Test
    void testScriptInjection() {
        assertFalse(validator.isValid("<script>alert('xss')</script>", null));
        assertFalse(validator.isValid("javascript:alert(1)", null));
    }

    @Test
    void testDangerousCharacters() {
        assertFalse(validator.isValid("test'; --comment", null));
        assertFalse(validator.isValid("'; DROP TABLE users; --", null));
        assertFalse(validator.isValid("javascript:alert(1)", null));
    }
}
