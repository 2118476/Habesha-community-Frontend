import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useUnreadCount from '../hooks/useUnreadCount';

// Sidebar navigation. Links are displayed based on the user's
// role. Admin‑specific links only appear for users with the
// ADMIN role. You can extend this logic for additional roles.
const Sidebar = () => {
  const { roles } = useAuth();
  const isAdmin = roles.includes('ADMIN');
  const count = useUnreadCount();

  return (
    <nav className="sidebar">
      <ul>
        <li>
          <NavLink to="/" end>Dashboard</NavLink>
        </li>
        <li>
          <NavLink to="/profile">Profile</NavLink>
        </li>
        <li>
          <NavLink to="/messages" className="nav-item">Messages {count>0 && <span className="badge">+{count}</span>}</NavLink>
        </li>
        <li>
          <NavLink to="/friends">Friends</NavLink>
        </li>
        <li>
          <NavLink to="/travel">Travel</NavLink>
        </li>
        <li>
          <NavLink to="/rentals">Rentals</NavLink>
        </li>
        <li>
          <NavLink to="/services">Services</NavLink>
        </li>
        <li>
          <NavLink to="/events">Events</NavLink>
        </li>
        <li>
          <NavLink to="/ads">Ads</NavLink>
        </li>
        <li>
          <NavLink to="/subscription">Subscription</NavLink>
        </li>
        {isAdmin && (
          <>
            <li>
              <NavLink to="/admin" end>Admin Dashboard</NavLink>
            </li>
            <li>
              <NavLink to="/admin/users">Users</NavLink>
            </li>
            <li>
              <NavLink to="/admin/services">Services (Admin)</NavLink>
            </li>
            <li>
              <NavLink to="/admin/payments">Payments</NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Sidebar;