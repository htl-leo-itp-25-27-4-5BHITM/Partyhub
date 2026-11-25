package at.htl;

import com.fasterxml.jackson.databind.ObjectMapper;
import at.htl.validation.InputPolicy;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PushNotificationInputTest {
    @Test void serializesQuotesNewlinesAndBackslashesAsOneMessage() throws Exception {
        var service = new PushNotificationService(); service.objectMapper = new ObjectMapper();
        String message = "Quote \"party\"\nPath \\test\t🎉";
        var json = service.objectMapper.readTree(service.payload(message));
        assertEquals(message, json.path("aps").path("alert").path("body").asText());
        assertFalse(InputPolicy.deviceToken("abc/../../target"));
        assertTrue(InputPolicy.deviceToken("a".repeat(64)));
    }
}
