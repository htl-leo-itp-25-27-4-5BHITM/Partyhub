package at.htl.bringalong;

import at.htl.user.User;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class BringAlongItemDtoTest {

    private static BringAlongItem item(int quantity) {
        BringAlongItem item = new BringAlongItem();
        item.id = 1L;
        item.name = "Chips & Dips";
        item.unit = "Packung";
        item.quantity = quantity;
        return item;
    }

    private static BringAlongPledge pledge(long userId, String name, int quantity) {
        User user = new User();
        user.setId(userId);
        user.setDisplayName(name);
        BringAlongPledge pledge = new BringAlongPledge();
        pledge.user = user;
        pledge.quantity = quantity;
        return pledge;
    }

    @Test
    void itemWithoutPledges() {
        BringAlongItemDto dto = BringAlongItemDto.from(item(3), List.of());
        assertEquals(0, dto.pledged());
        assertEquals(3, dto.remaining());
        assertFalse(dto.fulfilled());
        assertTrue(dto.pledges().isEmpty());
    }

    @Test
    void partiallyCovered() {
        BringAlongItemDto dto = BringAlongItemDto.from(item(3), List.of(pledge(7, "Anna", 1)));
        assertEquals(1, dto.pledged());
        assertEquals(2, dto.remaining());
        assertFalse(dto.fulfilled());
        assertEquals(7L, dto.pledges().get(0).userId());
        assertEquals("Anna", dto.pledges().get(0).displayName());
        assertEquals(1, dto.pledges().get(0).quantity());
    }

    @Test
    void exactlyCovered() {
        BringAlongItemDto dto = BringAlongItemDto.from(item(3), List.of(pledge(1, "A", 1), pledge(2, "B", 2)));
        assertEquals(0, dto.remaining());
        assertTrue(dto.fulfilled());
    }

    @Test
    void overCoveredClampsRemaining() {
        BringAlongItemDto dto = BringAlongItemDto.from(item(2), List.of(pledge(1, "A", 3)));
        assertEquals(3, dto.pledged());
        assertEquals(0, dto.remaining());
        assertTrue(dto.fulfilled());
    }

    @Test
    void userTextIsHtmlEncoded() {
        BringAlongItemDto dto = BringAlongItemDto.from(item(1), List.of(pledge(1, "Tom \"T\"", 1)));
        assertEquals("Chips &amp; Dips", dto.name());
        assertEquals("Tom &#34;T&#34;", dto.pledges().get(0).displayName());
    }
}
