package at.htl.validation;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Validator;
import at.htl.user.UserCreateDto;

@ApplicationScoped
public class MailInput {
    @Inject Validator validator;
    public boolean accepts(String recipient, String subject) {
        return InputPolicy.singleLine(recipient, 254) && InputPolicy.mailHeader(subject)
                && validator.validate(new UserCreateDto(null, null, recipient, null, null)).isEmpty();
    }
}
