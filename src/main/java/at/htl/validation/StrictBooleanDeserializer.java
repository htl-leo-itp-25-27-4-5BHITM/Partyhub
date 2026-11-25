package at.htl.validation;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import java.io.IOException;

public class StrictBooleanDeserializer extends JsonDeserializer<Boolean> {
    @Override
    public Boolean deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        if (parser.currentToken() != JsonToken.VALUE_TRUE && parser.currentToken() != JsonToken.VALUE_FALSE)
            throw MismatchedInputException.from(parser, Boolean.class, "Expected a JSON boolean");
        return parser.getBooleanValue();
    }

    @Override
    public Boolean getAbsentValue(DeserializationContext context) { return false; }

    @Override
    public Boolean getNullValue(DeserializationContext context) throws MismatchedInputException {
        throw MismatchedInputException.from(context.getParser(), Boolean.class, "Expected a JSON boolean");
    }
}
