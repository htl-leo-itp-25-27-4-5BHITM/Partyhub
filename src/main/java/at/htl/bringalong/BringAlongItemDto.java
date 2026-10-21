package at.htl.bringalong;

import at.htl.user.User;
import org.owasp.encoder.Encode;
import java.util.List;

public record BringAlongItemDto(
        Long id,
        String name,
        String unit,
        int quantity,
        int pledged,
        int remaining,
        boolean fulfilled,
        List<PledgeDto> pledges
) {
    public record PledgeDto(Long userId, String displayName, int quantity) {}

    public static BringAlongItemDto from(BringAlongItem item, List<BringAlongPledge> pledges) {
        int pledged = pledges.stream().mapToInt(p -> p.quantity).sum();
        return new BringAlongItemDto(
                item.id,
                Encode.forHtml(item.name),
                item.unit == null ? null : Encode.forHtml(item.unit),
                item.quantity,
                pledged,
                Math.max(0, item.quantity - pledged),
                pledged >= item.quantity,
                pledges.stream()
                        .map(p -> new PledgeDto(p.user.getId(), Encode.forHtml(displayName(p.user)), p.quantity))
                        .toList());
    }

    private static String displayName(User user) {
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) return user.getDisplayName();
        if (user.getDistinctName() != null && !user.getDistinctName().isBlank()) return user.getDistinctName();
        return user.getUsername() == null ? "Someone" : user.getUsername();
    }
}
