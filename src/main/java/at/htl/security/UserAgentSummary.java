package at.htl.security;

/** Turns a User-Agent header into "Firefox on Windows" for security mails. Unknown parts stay generic. */
public final class UserAgentSummary {

    private UserAgentSummary() {
    }

    public static String of(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "an unknown browser";
        }
        return browser(userAgent) + " on " + system(userAgent);
    }

    private static String browser(String ua) {
        // Order matters: Edge and Opera also contain "Chrome", Chrome also contains "Safari".
        if (ua.contains("Edg/")) return "Edge";
        if (ua.contains("OPR/") || ua.contains("Opera")) return "Opera";
        if (ua.contains("Firefox/")) return "Firefox";
        if (ua.contains("Chrome/") || ua.contains("CriOS/")) return "Chrome";
        if (ua.contains("Safari/")) return "Safari";
        return "A browser";
    }

    private static String system(String ua) {
        if (ua.contains("iPhone") || ua.contains("iPad")) return "iOS";
        if (ua.contains("Android")) return "Android";
        if (ua.contains("Windows")) return "Windows";
        if (ua.contains("Mac OS X") || ua.contains("Macintosh")) return "macOS";
        if (ua.contains("Linux")) return "Linux";
        return "an unknown system";
    }
}
