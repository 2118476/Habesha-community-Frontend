import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Link to a user's public profile.
 * Accepts { id, username, children }.
 * Falls back to /app/u/:id.
 */
export default function UserLink({ id, username, children, className='' }) {
  const to = username ? `/app/u/${username}` : `/app/u/${id}`;
  return <Link to={to} className={className}>{children}</Link>;
}