package at.htl.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class NoHtmlValidator implements ConstraintValidator<NoHtml, String> {

    private static final Pattern HTML_PATTERN = Pattern.compile(
        "<[^>]*>|&[a-zA-Z]+;|&#\\d+;",
        Pattern.CASE_INSENSITIVE
    );

    @Override
    public void initialize(NoHtml constraintAnnotation) {
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true;
        }

        if (HTML_PATTERN.matcher(value).find()) {
            if (context != null) {
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate("Input must not contain HTML tags")
                       .addConstraintViolation();
            }
            return false;
        }

        return true;
    }
}
