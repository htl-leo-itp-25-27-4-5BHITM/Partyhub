package at.htl.security;

import at.htl.validation.NoHtml;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public final class EmailChangeDtos {

    private EmailChangeDtos() {
    }

    public record EmailChangeCreateDto(
            @NotBlank(message = "Enter your new e-mail address")
            @Email(message = "Enter a valid e-mail address")
            @Size(max = 254, message = "The e-mail address is too long")
            @NoHtml(message = "The e-mail address must not contain HTML")
            String newEmail) {
    }

    public record EmailChangeTokenDto(
            @NotBlank(message = "The link is incomplete")
            @Size(max = 128, message = "The link is invalid")
            String token) {
    }

    public record PendingEmailChangeDto(boolean pending, String newEmail, OffsetDateTime createdAt,
                                        OffsetDateTime expiresAt) {
        static PendingEmailChangeDto none() {
            return new PendingEmailChangeDto(false, null, null, null);
        }

        static PendingEmailChangeDto from(EmailChangeService.Pending pending) {
            return new PendingEmailChangeDto(true, pending.newEmail(), pending.createdAt(), pending.expiresAt());
        }
    }

    public record NotMeResultDto(String passwordResetUrl) {
    }
}
