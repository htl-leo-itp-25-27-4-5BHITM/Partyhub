package at.htl.media;

/** canDelete: whether the caller may delete this item (uploader or party host). */
public record MediaDto(Long id, Long partyId, boolean canDelete) {
}
