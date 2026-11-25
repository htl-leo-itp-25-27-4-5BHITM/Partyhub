package at.htl.settings;

import jakarta.validation.constraints.NotNull;

/**
 * Account privacy. Going public accepts all open follow requests, so the client has to send
 * {@code acceptPendingRequests=true} once the user confirmed that.
 */
public record PrivacyDto(
        @NotNull(message = "Choose private or public") Boolean isPrivate,
        Boolean acceptPendingRequests) {
}
