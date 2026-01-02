import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * Add these links into your main nav or dashboard tiles.
 * Safe to render anywhere: it only exposes routes that already exist.
 */
export default function NavPatch() {
  const linkStyle = ({ isActive }) => ({
    padding: '8px 12px',
    borderRadius: 10,
    textDecoration: 'none',
    display: 'inline-block',
    marginRight: 8,
    background: isActive ? 'rgba(0,0,0,0.06)' : 'transparent'
  });

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <NavLink to="/app/travel" style={linkStyle}>Travel</NavLink>
      <NavLink to="/app/travel/post" style={linkStyle}>Post Travel</NavLink>
      <NavLink to="/app/travel/mine" style={linkStyle}>My Travel</NavLink>

      <NavLink to="/app/homeswap" style={linkStyle}>Home Swap</NavLink>
      <NavLink to="/app/homeswap/post" style={linkStyle}>Post Home Swap</NavLink>
    </div>
  );
}
