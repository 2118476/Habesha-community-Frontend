import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../stylus/sections/PublicAbout.module.scss';
import Footer from '../layout/Footer';

/** Public, login-free Terms of Use, reachable at /terms. */
const CONTACT_EMAIL = 'mihretabtesfahun2124@gmail.com';

export default function PublicTerms() {
  return (
    <div>
      <div className={styles.container}>
        <h1>Terms of Use</h1>
        <p><em>Last updated: June 2026</em></p>

        <p>
          Welcome to <strong>Habesha Community</strong>. By creating an account or using
          the app, you agree to these terms. Please read them carefully.
        </p>

        <h2>1. Who can use Habesha Community</h2>
        <p>You must be at least 18 years old and provide accurate information. You are responsible for keeping your account secure.</p>

        <h2>2. Community conduct</h2>
        <ul>
          <li>Be respectful. No harassment, hate speech, scams, or illegal content.</li>
          <li>Only post listings and content you have the right to share, with honest details.</li>
          <li>Do not impersonate others or post on behalf of someone without permission.</li>
        </ul>

        <h2>3. Listings &amp; transactions</h2>
        <p>
          Habesha Community is a place for members to connect — for rentals, services,
          events, travel, home swaps and marketplace items. We are <strong>not a party</strong>
          to any agreement, payment or transaction between members, and we do not verify
          listings. You are responsible for your own dealings and for taking sensible
          safety precautions when meeting or transacting with others.
        </p>

        <h2>4. Your content</h2>
        <p>You keep ownership of the content you post. You grant us a licence to host and display it within the app so the service can function. You are responsible for the content you upload.</p>

        <h2>5. Prohibited use</h2>
        <p>Do not misuse the app, attempt to disrupt it, scrape data, or use it for unlawful purposes. We may remove content and suspend or terminate accounts that break these terms.</p>

        <h2>6. No warranty &amp; limitation of liability</h2>
        <p>The app is provided “as is”. To the fullest extent permitted by law, we are not liable for losses arising from your use of the app or from dealings between members.</p>

        <h2>7. Termination</h2>
        <p>You may delete your account at any time in Settings. We may suspend or close accounts that violate these terms.</p>

        <h2>8. Changes</h2>
        <p>We may update these terms; the latest version will always be posted here.</p>

        <h2>9. Contact</h2>
        <p>Questions: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>

        <p style={{ marginTop: 24 }}>
          <Link to="/privacy">Privacy Policy</Link> · <Link to="/">Back to home</Link>
        </p>
      </div>
      <Footer />
    </div>
  );
}
