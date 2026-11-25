package at.htl.validation;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
public class TextInputValidator implements ConstraintValidator<TextInput, String> {
    private boolean multiline;
    @Override
    public void initialize(TextInput rule) { multiline = rule.multiline(); }
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value == null || value.codePoints().noneMatch(c -> Character.isISOControl(c)
                && !(multiline && (c == '\n' || c == '\r' || c == '\t')));
    }
}
