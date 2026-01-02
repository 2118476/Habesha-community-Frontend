import React from 'react';
import { Link } from 'react-router-dom';

export default function ProfileLink({ userId, children, className }) {
  if (!userId) return <span className={className}>{children}</span>;
  return <Link to={`/app/profile/${userId}`} className={className}>{children}</Link>;
}
