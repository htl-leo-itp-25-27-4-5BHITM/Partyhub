package at.htl.validation;


/** Field policies shared by HTTP input and identity-provider provisioning. */
public final class InputPolicy {
    private InputPolicy() {}

    public static boolean singleLine(String value, int max) {
        return value != null && !value.isBlank() && value.length() <= max
                && value.codePoints().noneMatch(Character::isISOControl);
    }

    public static boolean handle(String value) {
        return singleLine(value, 255) && value.codePoints().noneMatch(c -> Character.isWhitespace(c) || Character.isSpaceChar(c));
    }

    public static String optional(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    public static boolean mailHeader(String value) {
        return singleLine(value, 998);
    }

    public static boolean deviceToken(String value) {
        return value != null && value.matches("[a-fA-F0-9]{64}");
    }
}
