import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ToastProvider from './components/ToastProvider';

// Auth pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Public/protected pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import UserProfilePage from './pages/UserProfilePage';     // ✅ Profile by ID
import MessagesPage from './pages/Messages';
import FriendsPage from './pages/Friends';

// ✅ New combined Travel board (post + list)
import TravelBoard from './pages/Travel/TravelBoard';

import RentalsList from './pages/Rentals/List';
import RentalsPost from './pages/Rentals/Post';
import RentalDetails from './pages/Rentals/Details';
import ServicesList from './pages/Services/List';
import ServicePost from './pages/Services/Post';
import ServiceDetails from './pages/Services/Details';
import EventsList from './pages/Events/List';
import EventPost from './pages/Events/Post';
import AdsList from './pages/Ads/List';
import AdPost from './pages/Ads/Post';
import SubscriptionPage from './pages/Subscription';
import AdDetails from './pages/Ads/Details';
import EventDetails from './pages/Events/Details';

// Admin pages
import AdminDashboard from './pages/Admin/Dashboard';
import AdminUsers from './pages/Admin/Users';
import AdminServices from './pages/Admin/Services';
import AdminPayments from './pages/Admin/Payments';

const App = () => {
  return (
    <>
      <ToastProvider />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/:id" element={<UserProfilePage />} /> {/* ✅ view other user's profile */}
            <Route path="messages" element={<MessagesPage />} />
            <Route path="friends" element={<FriendsPage />} />

            {/* ✅ New travel board (post + list) */}
            <Route path="travel" element={<TravelBoard />} />

            {/* Rentals / Services / Events / Ads */}
            <Route path="rentals" element={<RentalsList />} />
            <Route path="rentals/post" element={<RentalsPost />} />
            <Route path="rentals/:id" element={<RentalDetails />} />
            <Route path="services" element={<ServicesList />} />
            <Route path="services/post" element={<ServicePost />} />
            <Route path="services/:id" element={<ServiceDetails />} />
            <Route path="events" element={<EventsList />} />
            <Route path="events/post" element={<EventPost />} />
            <Route path="events/:id" element={<EventDetails />} />
            <Route path="ads" element={<AdsList />} />
            <Route path="ads/post" element={<AdPost />} />
            <Route path="ads/:id" element={<AdDetails />} />
            <Route path="subscription" element={<SubscriptionPage />} />

            {/* Admin-only routes */}
            <Route element={<ProtectedRoute roles={['ADMIN']} />}>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/users" element={<AdminUsers />} />
              <Route path="admin/services" element={<AdminServices />} />
              <Route path="admin/payments" element={<AdminPayments />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Login />} />
      </Routes>
    </>
  );
};

export default App;
