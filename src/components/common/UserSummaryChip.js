import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../stylus/components/Chip.module.scss';
// Use the unified Avatar component instead of a raw <img> so that
// missing avatars gracefully fall back to initials and no longer
// depend on a non-existent `/default-avatar.png` file.
import Avatar from '../Avatar';

/**
 * A small user badge showing the avatar, display name and username of
 * the author.  Clicking navigates to the public profile page.
 */
const UserSummaryChip = ({ summary }) => {
  if (!summary) return null;
  // Support both legacy and new summary shapes by deriving
  // displayName, username and avatar fields.  The backend now
  // returns a displayName and id.  Fall back to name/username.
  const displayName = summary.displayName || summary.name || summary.username || 'User';
  const username = summary.username || summary.name || '';
  const id = summary.id;
  const avatar = summary.avatarUrl || summary.profileImageUrl || summary.photoUrl || null;
  // When id is available, link to the profile route within the app; otherwise
  // fall back to the legacy `/u/:username` path for public profiles.
  const profileUrl = id ? `/app/profile/${id}` : (username ? `/app/u/${username}` : '#');
  return (
    <Link to={profileUrl} className={styles.chip}>
      <Avatar
        user={{ id, name: displayName, avatarUrl: avatar }}
        size="sm"
        className={styles.avatar}
      />
      <span className={styles.name}>{displayName}</span>
      {/* Show the username handle if known */}
      {username && <span className={styles.handle}>@{username}</span>}
    </Link>
  );
};

export default UserSummaryChip;