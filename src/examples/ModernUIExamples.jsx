/**
 * Modern UI Examples
 * 
 * This file demonstrates how to use the new modern styling system
 * with scroll reveals, animations, and utility classes.
 * 
 * Copy these patterns into your components!
 */

import React from 'react';

// Example 1: Hero Section with Scroll Reveal
export function HeroSection() {
  return (
    <section className="container" style={{ paddingBlock: '80px' }}>
      {/* Main heading with gradient and reveal */}
      <h1 
        className="gradient-text" 
        data-reveal="up"
        style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '1rem' }}
      >
        Welcome to Habesha Community
      </h1>
      
      {/* Subtitle with delay */}
      <p 
        className="text-muted" 
        data-reveal="up"
        style={{ 
          textAlign: 'center', 
          fontSize: '1.25rem',
          '--reveal-delay': '200ms' 
        }}
      >
        Connect, Share, and Grow Together
      </p>
      
      {/* CTA buttons with stagger */}
      <div 
        className="cluster-md" 
        data-reveal="scale"
        style={{ 
          justifyContent: 'center', 
          marginTop: '2rem',
          '--reveal-delay': '400ms'
        }}
      >
        <button className="hover-lift" style={{ padding: '12px 24px' }}>
          Get Started
        </button>
        <button className="hover-scale" style={{ padding: '12px 24px' }}>
          Learn More
        </button>
      </div>
    </section>
  );
}

// Example 2: Feature Cards with Staggered Reveal
export function FeatureCards() {
  const features = [
    { title: 'Connect', icon: '🤝', description: 'Build meaningful connections' },
    { title: 'Share', icon: '📱', description: 'Share your experiences' },
    { title: 'Grow', icon: '🌱', description: 'Grow together as a community' },
  ];

  return (
    <section className="container" style={{ paddingBlock: '60px' }}>
      <h2 
        className="gradient-text" 
        data-reveal="up"
        style={{ textAlign: 'center', marginBottom: '3rem' }}
      >
        Why Join Us?
      </h2>
      
      {/* Grid with staggered card reveals */}
      <div className="grid-3" data-reveal="list-up">
        {features.map((feature, index) => (
          <div 
            key={index}
            className="card card-hover glass"
            style={{ padding: '2rem', textAlign: 'center' }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {feature.icon}
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>{feature.title}</h3>
            <p className="text-muted">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// Example 3: Stats Section with Scale Animation
export function StatsSection() {
  const stats = [
    { value: '10K+', label: 'Members' },
    { value: '50K+', label: 'Posts' },
    { value: '100K+', label: 'Connections' },
    { value: '24/7', label: 'Support' },
  ];

  return (
    <section 
      className="gradient-brand" 
      style={{ paddingBlock: '60px', color: 'white' }}
    >
      <div className="container">
        <div className="grid-auto" data-reveal="list-scale">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="glass-strong"
              style={{ 
                padding: '2rem', 
                textAlign: 'center',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div 
                className="pulse-glow"
                style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: 'bold',
                  marginBottom: '0.5rem'
                }}
              >
                {stat.value}
              </div>
              <div style={{ opacity: 0.9 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Example 4: Testimonial Cards with Blur Effect
export function TestimonialSection() {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Community Member',
      text: 'This platform has changed my life! I\'ve made so many connections.',
      avatar: '👩'
    },
    {
      name: 'Michael Chen',
      role: 'Active Contributor',
      text: 'The best community platform I\'ve ever used. Highly recommended!',
      avatar: '👨'
    },
  ];

  return (
    <section className="container" style={{ paddingBlock: '60px' }}>
      <h2 
        className="gradient-text" 
        data-reveal="up"
        style={{ textAlign: 'center', marginBottom: '3rem' }}
      >
        What Our Members Say
      </h2>
      
      <div className="grid-2" data-reveal="list-blur">
        {testimonials.map((testimonial, index) => (
          <div 
            key={index}
            className="card glass elevation-2"
            style={{ padding: '2rem' }}
          >
            <div className="flex items-center" style={{ marginBottom: '1rem' }}>
              <div 
                style={{ 
                  fontSize: '2rem', 
                  marginRight: '1rem',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--brand-soft)',
                  borderRadius: '50%'
                }}
              >
                {testimonial.avatar}
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>{testimonial.name}</div>
                <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                  {testimonial.role}
                </div>
              </div>
            </div>
            <p className="text-muted">{testimonial.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// Example 5: Interactive List with Hover Effects
export function InteractiveList() {
  const items = [
    'Create your profile',
    'Connect with others',
    'Share your story',
    'Join communities',
    'Attend events',
  ];

  return (
    <section className="container-narrow" style={{ paddingBlock: '60px' }}>
      <h2 
        className="gradient-text" 
        data-reveal="up"
        style={{ textAlign: 'center', marginBottom: '2rem' }}
      >
        Getting Started
      </h2>
      
      <div className="stack-sm" data-reveal="list-left">
        {items.map((item, index) => (
          <div 
            key={index}
            className="card card-interactive hover-lift"
            style={{ 
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <div 
              className="badge"
              style={{ 
                width: '32px', 
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {index + 1}
            </div>
            <div style={{ fontWeight: '500' }}>{item}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Example 6: Loading States
export function LoadingExample() {
  return (
    <div className="container" style={{ paddingBlock: '60px' }}>
      <h2 style={{ marginBottom: '2rem' }}>Loading States</h2>
      
      {/* Skeleton loading */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div className="skeleton" style={{ height: '24px', width: '60%', marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: '16px', width: '100%', marginBottom: '0.5rem' }} />
        <div className="skeleton" style={{ height: '16px', width: '80%' }} />
      </div>
      
      {/* Pulse loading */}
      <div className="card pulse" style={{ padding: '2rem' }}>
        <p>Loading content...</p>
      </div>
    </div>
  );
}

// Example 7: Badge Showcase
export function BadgeShowcase() {
  return (
    <div className="container" style={{ paddingBlock: '60px' }}>
      <h2 data-reveal="up" style={{ marginBottom: '2rem' }}>Status Badges</h2>
      
      <div className="cluster-md" data-reveal="scale">
        <span className="badge">Default</span>
        <span className="badge badge-success">Success</span>
        <span className="badge badge-danger">Danger</span>
        <span className="badge badge-info">Info</span>
      </div>
    </div>
  );
}

// Example 8: Complete Page Example
export function CompletePage() {
  return (
    <div>
      <HeroSection />
      <FeatureCards />
      <StatsSection />
      <TestimonialSection />
      <InteractiveList />
      <BadgeShowcase />
    </div>
  );
}

// Export all examples
export default {
  HeroSection,
  FeatureCards,
  StatsSection,
  TestimonialSection,
  InteractiveList,
  LoadingExample,
  BadgeShowcase,
  CompletePage,
};
