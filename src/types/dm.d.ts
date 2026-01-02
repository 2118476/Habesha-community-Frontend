export type DMNavState = {
  selectedUserId?: string;
  selectedUserName?: string;
  prefillMessage?: string;
  focusComposer?: boolean;
  contextType?: 'rentals'|'homeswap'|'travel'|'service'|'event'|'ad'|'profile'|string;
  contextId?: string|number;
};
