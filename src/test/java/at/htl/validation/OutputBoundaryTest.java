package at.htl.validation;

import io.quarkus.qute.Template;
import io.quarkus.qute.Location;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class OutputBoundaryTest {
    @Inject MailInput mailInput;
    @Inject @Location("emails/welcome.html") Template welcome;

    @Test void welcomeTemplateEscapesNamesAndSiteAttribute() {
        String html = welcome.data("displayName", "<img src=x onerror=alert(1)>")
                .data("userId", 1).data("siteUrl", "https://example.com/\" onclick=\"alert(1)").render();
        assertFalse(html.contains("<img src=x"));
        assertTrue(html.contains("&lt;img"));
        assertFalse(html.contains("href=\"https://example.com/\" onclick="));
    }
    @Test void mailHeadersRejectControlsWithoutBanningBodyNewlines() {
        assertTrue(mailInput.accepts("name@example.com", "Reunion & O'Brien"));
        assertFalse(mailInput.accepts("x@example.com\r\nBcc:attacker@example.com", "Subject"));
        assertFalse(mailInput.accepts("name@example.com", "Subject\r\nBcc:attacker@example.com"));
        assertFalse(mailInput.accepts("not-an-email", "Subject"));
    }
}
