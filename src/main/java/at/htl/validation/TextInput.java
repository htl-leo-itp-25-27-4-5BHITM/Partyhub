package at.htl.validation;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.TYPE_USE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = TextInputValidator.class)
public @interface TextInput {
    String message() default "Text contains unsupported control characters";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    boolean multiline() default false;
}
