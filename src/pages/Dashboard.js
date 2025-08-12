import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Home page after login. A hero banner welcomes the user and highlights
// key areas of the community with a grid of feature cards.
const Dashboard = () => {
  const { user } = useAuth();

  // Define the cards shown on the home page. Each card links to a
  // different section of the app and uses a corresponding placeholder
  // image stored in the public folder.
  const features = [
    {
      name: 'Travel',
      description: 'Find and share rides',
      image: '/images/travel.png',
      link: '/travel',
    },
    {
      name: 'Rentals',
      description: 'Discover housing options',
      image: '/images/marketplace.png',
      link: '/rentals',
    },
    {
      name: 'Services',
      description: 'Offer and hire services',
      image: '/images/profile.png',
      link: '/services',
    },
    {
      name: 'Events',
      description: 'Join community events',
      image: '/images/events.png',
      link: '/events',
    },
    {
      name: 'Ads',
      description: 'Buy and sell items',
      image: '/images/marketplace.png',
      link: '/ads',
    },
  ];

  return (
    <div className="dashboard-page">
      {/* Hero banner */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            {user ? 'Welcome, ' + user.name : 'Welcome'} to Habesha Community Hub
          </h1>
          <p>Connect, share, and grow together</p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="features-section">
        <h2 className="section-title">Explore Our Community</h2>
        <div className="feature-grid">
          {features.map(({ name, description, image, link }) => (
            <Link to={link} key={name} className="feature-card">
              <img src={image} alt={name} />
              <h3>{name}</h3>
              <p>{description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;