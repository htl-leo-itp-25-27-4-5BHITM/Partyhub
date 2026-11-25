package at.htl.settings;

import jakarta.validation.constraints.NotNull;

public record UserSettingsDto(@NotNull(message = "Theme is required") Theme theme) {
    public static UserSettingsDto from(UserSettings settings) {
        return new UserSettingsDto(settings.getTheme());
    }

    public static UserSettingsDto defaults() {
        return new UserSettingsDto(Theme.SYSTEM);
    }
}
