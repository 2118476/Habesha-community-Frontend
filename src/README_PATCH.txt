PATCH: Universal “Contact Owner” deep-link to the correct DM thread ✅

What’s included
---------------
1) `src/pages/Messages/Messages.jsx`
   - Honors deep links: `/app/messages/thread/:id`
   - Reads `location.state` for: selectedUserId, selectedUserName, prefillMessage, focusComposer, contextType, contextId
   - Ensures thread via `POST /api/messages/ensure-thread { userId }`
   - Loads conversation for that user id (tries `/api/messages/:id`, `/api/messages/with/:id`, `/api/messages/thread/:id`)
   - Prefills composer and focuses textarea when requested
   - Never auto-selects a random thread when a deep-link target exists
   - Reconciles once thread list is loaded

2) `src/utils/dmNavigation.js`
   - `navigateToDM(navigate, ownerUserId, options)` — core deep-link helper
   - `navigateToDMFromItem(navigate, item, { module })` — resolves owner id/name + builds prefill automatically
   - `resolveOwnerId`, `resolveOwnerName`, `buildPrefillMessage` helpers

3) `src/components/ContactOwnerCTA.jsx`
   - Drop-in button that calls `navigateToDMFromItem`
   - Use this across: Home Swap, Rentals, Travel, Services, Events, Ads, Profile

4) `src/types/dm.d.ts` (optional typings if you use TS elsewhere)

How to wire routes
------------------
Add this route (keep your generic /app/messages too):

  import Messages from './pages/Messages/Messages';
  // ...
  <Route path="/app/messages" element={<Messages />} />
  <Route path="/app/messages/thread/:id" element={<Messages />} />

How to use the CTA
------------------
On any details page:

  import ContactOwnerCTA from '@/components/ContactOwnerCTA';

  <ContactOwnerCTA item={listing} module="rentals" label="I'm interested" className="btn btn-primary" />

Or inline without the component:

  import { navigateToDMFromItem } from '@/utils/dmNavigation';
  const navigate = useNavigate();
  const onContact = () => navigateToDMFromItem(navigate, listing, { module: 'homeswap' });

Notes
-----
- Adjust API endpoints if your backend differs.
- The Messages screen expects an axios instance at `src/api/axiosInstance`.
- IDs are always treated as strings; do not cast to numbers.
- Thread list auto-selection ONLY happens when there is no deep-link target.
