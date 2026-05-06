package at.htl.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class SafeTextValidator implements ConstraintValidator<SafeText, String> {

    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
        "(?i)(.*(?:union|select|insert|update|delete|drop|create|alter|truncate|exec|execute|script|javascript|--|\\|\\||&&|;|'|\\\").*)",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern DANGEROUS_CHARS = Pattern.compile(
        "['\";\\-](?:--|;|\\|\\||&&)|(?i)<script|<iframe|javascript:|on\\w+\\s*=",
        Pattern.CASE_INSENSITIVE
    );

    @Override
    public void initialize(SafeText constraintAnnotation) {
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true;
        }

        if (SQL_INJECTION_PATTERN.matcher(value).matches() || DANGEROUS_CHARS.matcher(value).find()) {
            if (context != null) {
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate("Input contains potentially dangerous SQL or script patterns")
                       .addConstraintViolation();
            }
            return false;
        }

        return true;
    }
}