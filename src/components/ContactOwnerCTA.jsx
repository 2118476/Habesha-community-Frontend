import React from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateToDMFromItem } from '../utils/dmNavigation';

/**
 * Drop-in button for any details page to contact the owner directly.
 * Props:
 *  - item: the listing-like object (must contain an owner/user id in one of the known shapes)
 *  - module: one of 'rentals'|'homeswap'|'travel'|'service'|'event'|'ad'|'profile' (for analytics/context)
 *  - label: button label (default: "Contact owner")
 *  - className: optional class
 */
export default function ContactOwnerCTA({ item, module, label = "Contact owner", className = "" }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigateToDMFromItem(navigate, item, { module });
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {label}
    </button>
  );
}
