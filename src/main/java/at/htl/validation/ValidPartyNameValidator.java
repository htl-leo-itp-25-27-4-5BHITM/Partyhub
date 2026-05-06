package at.htl.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class ValidPartyNameValidator implements ConstraintValidator<ValidPartyName, String> {

    private static final Pattern VALID_NAME = Pattern.compile(
        "^[\\w\\s\\-ÖÄÜöäüß.,!?()'`~]{2,100}$",
        Pattern.UNICODE_CASE
    );

    @Override
    public void initialize(ValidPartyName constraintAnnotation) {
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank() || value.length() < 2) {
            if (context != null) {
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate(
                    "Party name must be 2-100 characters and contain only letters, numbers, spaces, and common punctuation"
                ).addConstraintViolation();
            }
            return false;
        }

        if (!VALID_NAME.matcher(value).matches()) {
            if (context != null) {
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate(
                    "Party name must be 2-100 characters and contain only letters, numbers, spaces, and common punctuation"
                ).addConstraintViolation();
            }
            return false;
        }

        return true;
    }
}