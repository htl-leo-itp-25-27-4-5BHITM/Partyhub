package at.htl.validation;

import at.htl.bringalong.BringAlongItemRequest;
import at.htl.bringalong.BringAlongPledgeRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class BringAlongValidationTest {
    @Inject Validator validator;
    @Inject ObjectMapper mapper;

    @Test
    void validItemPasses() {
        assertTrue(validator.validate(new BringAlongItemRequest("Chips", "Packung", 3)).isEmpty());
        assertTrue(validator.validate(new BringAlongItemRequest("Chips", null, 1)).isEmpty());
    }

    @Test
    void invalidItemsAreRejected() {
        assertFalse(validator.validate(new BringAlongItemRequest("  ", null, 3)).isEmpty());
        assertFalse(validator.validate(new BringAlongItemRequest("<b>Chips</b>", null, 3)).isEmpty());
        assertFalse(validator.validate(new BringAlongItemRequest("Chips", "<i>Stk</i>", 3)).isEmpty());
        assertFalse(validator.validate(new BringAlongItemRequest("Chips", null, 0)).isEmpty());
        assertFalse(validator.validate(new BringAlongItemRequest("Chips", null, 10001)).isEmpty());
        assertFalse(validator.validate(new BringAlongItemRequest("Chips", null, null)).isEmpty());
        assertFalse(validator.validate(new BringAlongItemRequest("x".repeat(101), null, 1)).isEmpty());
        assertFalse(validator.validate(new BringAlongItemRequest("Chips", "x".repeat(31), 1)).isEmpty());
    }

    @Test
    void pledgeQuantityBounds() {
        assertTrue(validator.validate(new BringAlongPledgeRequest(1)).isEmpty());
        assertFalse(validator.validate(new BringAlongPledgeRequest(0)).isEmpty());
        assertFalse(validator.validate(new BringAlongPledgeRequest(null)).isEmpty());
    }

    @Test
    void quantitiesMustBeWholeJsonNumbers() throws Exception {
        assertEquals(2, mapper.readValue("{\"quantity\": 2}", BringAlongPledgeRequest.class).quantity());
        assertThrows(MismatchedInputException.class,
                () -> mapper.readValue("{\"quantity\": 1.5}", BringAlongPledgeRequest.class));
        assertThrows(MismatchedInputException.class,
                () -> mapper.readValue("{\"quantity\": 2.7}", BringAlongPledgeRequest.class));
        assertThrows(MismatchedInputException.class,
                () -> mapper.readValue("{\"quantity\": \"2\"}", BringAlongPledgeRequest.class));
        assertThrows(MismatchedInputException.class,
                () -> mapper.readValue("{\"name\": \"Chips\", \"quantity\": 1.5}", BringAlongItemRequest.class));
    }
}
