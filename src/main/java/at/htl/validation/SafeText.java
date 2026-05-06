package at.htl.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Constraint(validatedBy = SafeTextValidator.class)
public @interface SafeText {
    String message() default "Input contains potentially dangerous SQL patterns";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}