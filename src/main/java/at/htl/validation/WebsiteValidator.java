package at.htl.validation;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.net.URI;
public class WebsiteValidator implements ConstraintValidator<Website, String> {
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) return true;
        if (value.codePoints().anyMatch(c -> Character.isWhitespace(c) || Character.isISOControl(c))) return false;
        try {
            URI uri = new URI(value);
            return ("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme()))
                    && uri.getHost() != null && uri.getRawUserInfo() == null;
        } catch (java.net.URISyntaxException e) { return false; }
    }
}
