package at.htl.validation;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import java.io.IOException;

public class StrictDoubleDeserializer extends JsonDeserializer<Double> {
    @Override
    public Double deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        if (parser.currentToken() != JsonToken.VALUE_NUMBER_INT && parser.currentToken() != JsonToken.VALUE_NUMBER_FLOAT)
            throw MismatchedInputException.from(parser, Double.class, "Expected a JSON number");
        double value = parser.getDoubleValue();
        if (!Double.isFinite(value)) throw MismatchedInputException.from(parser, Double.class, "Expected a finite number");
        return value;
    }
}
