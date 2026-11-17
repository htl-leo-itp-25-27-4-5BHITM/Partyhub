package at.htl.media;

import java.time.LocalDateTime;

/**
 * canDelete: whether the caller may delete this item (uploader or party host).
 * The uploader fields are null when the uploader no longer exists; uploadedAt is null for items
 * stored before upload times were recorded.
 */
public record MediaDto(Long id, Long partyId, boolean canDelete,
                       Long uploaderId, String uploaderHandle, String uploaderDisplayName,
                       LocalDateTime uploadedAt) {
}
