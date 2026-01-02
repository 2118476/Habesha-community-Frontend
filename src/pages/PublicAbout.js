import React from 'react';
import styles from '../stylus/sections/PublicAbout.module.scss';
import Footer from '../layout/Footer';

/**
 * PublicAbout renders a short, friendly description of the Habesha Community
 * marketplace. It explains who the platform is for and highlights the
 * different features available to members of the Ethiopian diaspora and
 * their friends across the UK. Basic community guidelines are included
 * to set expectations around safety and respectful interaction.
 */
const PublicAbout = () => {
  return (
    <div>
      <div className={styles.container}>
      <h1>About Habesha Community</h1>
      <p>
        <strong>Habesha Community</strong> is a welcoming online hub for
        Ethiopians and Habesha friends living across the UK. Whether
        you’re looking for a flat‑share in London, a tutor for your child,
        or a travel companion for your next trip back home, this
        platform brings people together to share resources and support
        one another.
      </p>
      <p>
        Our marketplace includes <em>rentals</em>, <em>services</em>,
        <em>events</em>, a <em>travel board</em>, classified ads and
        social features like profiles, messaging and friendships. It’s
        designed with and for the Habesha diaspora—connecting you to
        trusted community members and cultural experiences.
      </p>
      <h2>Who is it for?</h2>
      <p>
        Habesha Community is open to all Ethiopians, Eritreans and friends
        of our culture living in the UK. We celebrate diversity and
        inclusivity—everyone is welcome to join, so long as they respect
        our values.
      </p>
      <h2>Community guidelines</h2>
      <ul>
        <li>Be kind and respectful when interacting with others.</li>
        <li>Only post truthful and accurate information in listings.</li>
        <li>Meet in public places and tell a friend where you’re going.</li>
        <li>Report any suspicious or inappropriate content immediately.</li>
      </ul>
      <p>
        We’re constantly improving the platform and welcome your feedback.
        If you have suggestions or need assistance, please visit the
        <strong>Contact</strong> page to get in touch.
      </p>
      </div>
      <Footer />
    </div>
  );
};

export default PublicAbout;