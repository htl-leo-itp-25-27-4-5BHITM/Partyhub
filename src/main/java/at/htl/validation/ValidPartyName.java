package at.htl.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Constraint(validatedBy = ValidPartyNameValidator.class)
public @interface ValidPartyName {
    String message() default "Invalid party name format";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}