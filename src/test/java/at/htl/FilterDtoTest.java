package at.htl;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class FilterDtoTest {

    @Test
    void testRecordCreation() {
        FilterDto dto = new FilterDto("test", "category", "2024-01-01", "2024-12-31");
        assertEquals("test", dto.q());
        assertEquals("category", dto.category());
        assertEquals("2024-01-01", dto.date_from());
        assertEquals("2024-12-31", dto.date_to());
    }

    @Test
    void testRecordEquality() {
        FilterDto dto1 = new FilterDto("a", "b", "c", "d");
        FilterDto dto2 = new FilterDto("a", "b", "c", "d");
        assertEquals(dto1, dto2);
        assertEquals(dto1.hashCode(), dto2.hashCode());
    }

    @Test
    void testRecordToString() {
        FilterDto dto = new FilterDto("q", null, null, null);
        assertNotNull(dto.toString());
        assertTrue(dto.toString().contains("q"));
    }
}
