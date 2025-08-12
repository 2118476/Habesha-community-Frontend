import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

// Layout component that includes the top navigation bar, the
// sidebar and a container for the current page. All protected
// routes that show the application shell should be rendered
// inside this component via a nested <Outlet /> from react‑router.
const Layout = () => {
  return (
    <div className="layout-container">
      <Navbar />
      <div className="content-wrapper">
        <Sidebar />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;