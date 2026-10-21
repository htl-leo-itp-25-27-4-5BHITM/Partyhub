package at.htl.validation;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import java.io.IOException;

/**
 * Accepts only JSON integer literals. Jackson would otherwise truncate 1.5 to 1
 * or coerce "2" to 2, which hides invalid quantities from validation.
 */
public class StrictIntDeserializer extends JsonDeserializer<Integer> {
    @Override
    public Integer deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        if (p.currentToken() != JsonToken.VALUE_NUMBER_INT) {
            throw MismatchedInputException.from(p, Integer.class, "Quantity must be a whole number");
        }
        return p.getIntValue();
    }
}
