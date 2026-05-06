package at.htl.validation;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class NoHtmlValidatorTest {

    private final NoHtmlValidator validator = new NoHtmlValidator();

    @Test
    void testNullValue() {
        assertTrue(validator.isValid(null, null));
    }

    @Test
    void testBlankValue() {
        assertTrue(validator.isValid("   ", null));
    }

    @Test
    void testPlainText() {
        assertTrue(validator.isValid("Hello World", null));
        assertTrue(validator.isValid("Party at 8pm!", null));
        assertTrue(validator.isValid("user@email.com", null));
    }

    @Test
    void testHtmlTags() {
        assertFalse(validator.isValid("<script>alert('xss')</script>", null));
        assertFalse(validator.isValid("<div>Hello</div>", null));
        assertFalse(validator.isValid("<b>Bold text</b>", null));
        assertFalse(validator.isValid("<img src='x' onerror='alert(1)'/>", null));
    }

    @Test
    void testHtmlEntities() {
        assertFalse(validator.isValid("Hello &amp; World", null));
        assertFalse(validator.isValid("5 &gt; 3", null));
        assertFalse(validator.isValid("It's 5&#39; long", null));
        assertFalse(validator.isValid("Copyright &copy; 2024", null));
    }

    @Test
    void testSelfClosingTags() {
        assertFalse(validator.isValid("<br/>", null));
        assertFalse(validator.isValid("<hr />", null));
        assertFalse(validator.isValid("<input type='text'/>", null));
    }

    @Test
    void testNestedHtml() {
        assertFalse(validator.isValid("<div><p>Nested</p></div>", null));
    }

    @Test
    void testAttributeWithHtml() {
        assertFalse(validator.isValid("<a href='test'>link</a>", null));
    }
}
