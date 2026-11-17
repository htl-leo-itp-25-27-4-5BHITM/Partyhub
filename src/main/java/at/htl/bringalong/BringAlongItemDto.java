package at.htl.bringalong;

import at.htl.user.User;
import com.fasterxml.jackson.annotation.JsonInclude;
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
        // Null (and omitted from JSON) in the anonymised view for non-members of public parties.
        @JsonInclude(JsonInclude.Include.NON_NULL) List<PledgeDto> pledges
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

    /** Same totals as {@link #from}, but without pledges, so no user data is exposed. */
    public static BringAlongItemDto forPublic(BringAlongItem item, List<BringAlongPledge> pledges) {
        BringAlongItemDto full = from(item, pledges);
        return new BringAlongItemDto(full.id(), full.name(), full.unit(), full.quantity(), full.pledged(),
                full.remaining(), full.fulfilled(), null);
    }

    private static String displayName(User user) {
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) return user.getDisplayName();
        if (user.getDistinctName() != null && !user.getDistinctName().isBlank()) return user.getDistinctName();
        return user.getUsername() == null ? "Someone" : user.getUsername();
    }
}
