/**
 * Universal DM deep-link navigation helper.
 *
 * Use this from any "Contact / I'm interested" CTA to open a DIRECT 1:1
 * thread with the listing owner with a prefilled message and composer focus.
 *
 * Example:
 *   import { navigateToDMFromItem } from '@/utils/dmNavigation';
 *   // inside a click handler:
 *   navigateToDMFromItem(navigate, item, { module: 'rentals' });
 */

// If your project supports path aliases, you can replace relative imports accordingly.
// No runtime dependency here; only React Router's navigate function is required.

/**
 * Safely resolve a user id from a listing-like object.
 */
export function resolveOwnerId(item) {
  if (!item || typeof item !== 'object') return null;
  return (
    item?.postedBy?.id ||
    item?.owner?.id ||
    item?.user?.id ||
    item?.userId ||
    item?.ownerId ||
    null
  );
}

/**
 * Safely resolve a display name from a listing-like object.
 */
export function resolveOwnerName(item) {
  return (
    item?.postedBy?.name ||
    item?.owner?.name ||
    item?.user?.name ||
    item?.ownerName ||
    item?.userName ||        // HomeSwap uses userName
    item?.userUsername ||    // HomeSwap also has userUsername
    item?.username ||
    'User'
  );
}

/**
 * Build a nice prefill message using listing context.
 */
export function buildPrefillMessage(item, module) {
  const title = item?.title || item?.name || item?.headline || 'your listing';
  const location = item?.location || item?.city || item?.area || '';
  const parts = [
    `Hi ${resolveOwnerName(item)},`,
    `I'm interested in ${title}${location ? ` in ${location}` : ''}.`,
  ];
  // Add date or price if present to help context
  if (item?.date || item?.travelDate) parts.push(`Date: ${item.date || item.travelDate}.`);
  if (item?.price) parts.push(`Budget/Price seen: ${item.price}.`);
  if (module) parts.push(`#via:${module}`);
  return parts.join(' ');
}

/**
 * Navigate to the DM thread for a given ownerId with optional prefill/context.
 *
 * @param {Function} navigate - from react-router
 * @param {string} ownerUserId
 * @param {Object} options
 * @param {string} [options.ownerName]
 * @param {string} [options.prefillMessage]
 * @param {boolean} [options.focusComposer=true]
 * @param {string} [options.contextType]
 * @param {string|number} [options.contextId]
 */
export function navigateToDM(navigate, ownerUserId, options = {}) {
  if (!navigate || !ownerUserId) return;
  const {
    ownerName,
    prefillMessage,
    focusComposer = true,
    contextType,
    contextId,
  } = options;

  navigate(`/app/messages/thread/${String(ownerUserId)}`, {
    state: {
      selectedUserId: String(ownerUserId),
      selectedUserName: ownerName || 'User',
      prefillMessage: prefillMessage || '',
      focusComposer,
      contextType: contextType || null,
      contextId: contextId ?? null,
    },
  });
}

/**
 * Convenience wrapper to be called from listing/detail CTAs.
 *
 * @param {Function} navigate - from react-router
 * @param {Object} item - listing-like object
 * @param {Object} cfg
 * @param {('rentals'|'homeswap'|'travel'|'service'|'event'|'ad'|'profile'|string)} cfg.module
 * @param {string} [cfg.overrideOwnerId]
 */
export function navigateToDMFromItem(navigate, item, cfg = {}) {
  const ownerUserId = cfg.overrideOwnerId || resolveOwnerId(item);
  if (!ownerUserId) {
    console.warn('[dmNavigation] No owner id found in item:', item);
    return;
  }
  const ownerName = resolveOwnerName(item);
  const prefill = buildPrefillMessage(item, cfg.module);
  navigateToDM(navigate, ownerUserId, {
    ownerName,
    prefillMessage: prefill,
    focusComposer: true,
    contextType: cfg.module,
    contextId: item?.id ?? item?.uuid ?? null,
  });
}
