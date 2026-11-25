package at.htl.block;

import jakarta.persistence.*;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.Objects;

/** blockerId blocks blockedId. The effects (no profile, search, follows, invitations) apply both ways. */
@Entity
@Table(name = "user_block")
@IdClass(UserBlock.Key.class)
public class UserBlock {

    public static class Key implements Serializable {
        public Long blockerId;
        public Long blockedId;

        public Key() {
        }

        public Key(Long blockerId, Long blockedId) {
            this.blockerId = blockerId;
            this.blockedId = blockedId;
        }

        @Override
        public boolean equals(Object o) {
            return o instanceof Key key && Objects.equals(blockerId, key.blockerId) && Objects.equals(blockedId, key.blockedId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(blockerId, blockedId);
        }
    }

    @Id
    @Column(name = "blocker_id")
    private Long blockerId;

    @Id
    @Column(name = "blocked_id")
    private Long blockedId;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public UserBlock() {
    }

    public UserBlock(Long blockerId, Long blockedId) {
        this.blockerId = blockerId;
        this.blockedId = blockedId;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getBlockerId() {
        return blockerId;
    }

    public Long getBlockedId() {
        return blockedId;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
