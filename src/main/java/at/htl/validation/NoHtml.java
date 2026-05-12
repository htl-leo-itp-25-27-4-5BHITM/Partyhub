package at.htl.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Constraint(validatedBy = NoHtmlValidator.class)
public @interface NoHtml {
    String message() default "Input must not contain HTML tags";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}