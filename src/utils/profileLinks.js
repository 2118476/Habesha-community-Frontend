/**
 * Utility functions for generating consistent profile links across the application
 */

/**
 * Generate a profile link for a user
 * @param {Object} user - User object with id and/or username
 * @param {string|number} user.id - User ID
 * @param {string} user.username - Username
 * @returns {string} Profile link path
 */
export const getProfileLink = (user) => {
  if (!user) return null;
  
  // Clean username - remove @ prefix if present and ensure it's not empty/generic
  let username = user.username;
  if (username) {
    username = username.replace(/^@/, '');
    if (username.toLowerCase() === 'user' || username.toLowerCase() === 'unknown') {
      username = null;
    }
  }
  
  // Prefer username-based links for better UX, fallback to ID-based
  if (username) return `/app/u/${encodeURIComponent(username)}`;
  if (user.id) return `/app/profile/${user.id}`;
  
  return null;
};

/**
 * Generate a profile link from separate id and username parameters
 * @param {string|number} id - User ID
 * @param {string} username - Username
 * @returns {string} Profile link path
 */
export const getProfileLinkFromParams = (id, username) => {
  return getProfileLink({ id, username });
};

/**
 * Check if a profile link is valid
 * @param {string} link - Profile link to validate
 * @returns {boolean} Whether the link is valid
 */
export const isValidProfileLink = (link) => {
  if (!link || typeof link !== 'string') return false;
  return link.startsWith('/app/u/') || link.startsWith('/app/profile/');
};