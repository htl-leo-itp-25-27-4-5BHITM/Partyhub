package at.htl.validation;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.TYPE_USE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = WebsiteValidator.class)
public @interface Website {
    String message() default "Website must be an absolute HTTP or HTTPS URL";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
