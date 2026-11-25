package at.htl.user;

import at.htl.block.BlockRepository;
import at.htl.follow.FollowRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

/** What a viewer may see of a profile under the privacy and blocking rules. */
@ApplicationScoped
public class ProfileAccessService {

    public enum Access {
        /** Blocked in either direction: answer as if the profile did not exist. */
        NONE,
        /** Private account, viewer is no accepted follower: picture, name, handle, bio and counts only. */
        BASIC,
        FULL
    }

    @Inject
    BlockRepository blockRepository;

    @Inject
    FollowRepository followRepository;

    public Access access(Long viewerId, User owner) {
        if (owner == null) {
            return Access.NONE;
        }
        if (owner.getId().equals(viewerId)) {
            return Access.FULL;
        }
        if (blockRepository.isBlockedEitherWay(viewerId, owner.getId())) {
            return Access.NONE;
        }
        if (!owner.isPrivateAccount() || (viewerId != null && followRepository.isFollowing(viewerId, owner.getId()))) {
            return Access.FULL;
        }
        return Access.BASIC;
    }
}
