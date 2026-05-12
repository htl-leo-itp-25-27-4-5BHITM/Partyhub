package at.htl.validation;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class ValidPartyNameValidatorTest {

    private final ValidPartyNameValidator validator = new ValidPartyNameValidator();

    @Test
    void testNullValue() {
        assertFalse(validator.isValid(null, null));
    }

    @Test
    void testBlankValue() {
        assertFalse(validator.isValid("   ", null));
    }

    @Test
    void testTooShort() {
        assertFalse(validator.isValid("A", null));
    }

    @Test
    void testMinLength() {
        assertTrue(validator.isValid("AB", null));
    }

    @Test
    void testNormalPartyName() {
        assertTrue(validator.isValid("Epic Birthday Party", null));
    }

    @Test
    void testPartyNameWithNumbers() {
        assertTrue(validator.isValid("Party 2024", null));
    }

    @Test
    void testPartyNameWithSpaces() {
        assertTrue(validator.isValid("New Year's Eve Party", null));
    }

    @Test
    void testPartyNameWithSpecialChars() {
        assertTrue(validator.isValid("Bob's Party!", null));
        assertTrue(validator.isValid("Party (VIP)", null));
        assertTrue(validator.isValid("Summer-Party", null));
    }

    @Test
    void testPartyNameWithUmlauts() {
        assertTrue(validator.isValid("Müller's Party", null));
        assertTrue(validator.isValid("Öffentliche Feier", null));
        assertTrue(validator.isValid("Überraschungsparty", null));
    }

    @Test
    void testTooLongName() {
        String longName = "A".repeat(101);
        assertFalse(validator.isValid(longName, null));
    }

    @Test
    void testMaxLength() {
        String maxName = "A".repeat(100);
        assertTrue(validator.isValid(maxName, null));
    }

    @Test
    void testInvalidCharacters() {
        assertFalse(validator.isValid("Party <script>", null));
        assertFalse(validator.isValid("Party & Fun", null));
        assertFalse(validator.isValid("Party @ 8pm", null));
    }
}
