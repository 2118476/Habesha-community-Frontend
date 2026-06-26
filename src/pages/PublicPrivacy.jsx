import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../stylus/sections/PublicAbout.module.scss';
import Footer from '../layout/Footer';

/**
 * Public, login-free Privacy Policy. Reachable at /privacy so it can be used
 * as the Google Play "Privacy policy" URL.
 */
const CONTACT_EMAIL = 'mihretabtesfahun2124@gmail.com'; // update to a support email if you prefer

export default function PublicPrivacy() {
  return (
    <div>
      <div className={styles.container}>
        <h1>Privacy Policy</h1>
        <p><em>Last updated: June 2026</em></p>

        <p>
          <strong>Habesha Community</strong> (“we”, “us”, “the app”) is a community
          marketplace for Ethiopians, Eritreans and Habesha friends in the UK. This
          policy explains what personal information we collect, how we use it, and
          the choices you have.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li><strong>Account details</strong> you provide: name, username, email address, phone number, city/location, profile photo and an optional bio.</li>
          <li><strong>Content you create</strong>: listings (rentals, services, events, travel, home swaps, marketplace ads), photos you upload, reviews, and messages you send to other members.</li>
          <li><strong>Usage &amp; device data</strong>: basic technical data needed to run the app (e.g. log data, app version) and, on the mobile app, a push-notification token if you enable notifications.</li>
        </ul>

        <h2>How we use your information</h2>
        <ul>
          <li>To create and secure your account and verify your email.</li>
          <li>To show your listings and profile to other members and let people contact you.</li>
          <li>To deliver messages and (if you opt in) push notifications about new messages.</li>
          <li>To keep the community safe and enforce our terms.</li>
        </ul>
        <p>We do <strong>not</strong> sell your personal data.</p>

        <h2>Who we share it with</h2>
        <p>We share data only with service providers that help us run the app:</p>
        <ul>
          <li><strong>Hosting &amp; database/storage</strong> (e.g. Render, Supabase, Netlify) to store your account and content.</li>
          <li><strong>Firebase Cloud Messaging (Google)</strong> to deliver push notifications, if you enable them.</li>
          <li><strong>Email provider</strong> to send verification and account emails.</li>
        </ul>
        <p>Other members can see information you choose to make public, such as your name, profile photo, bio and the listings you post.</p>

        <h2>Your choices &amp; rights</h2>
        <ul>
          <li><strong>Edit your details</strong> any time in Settings.</li>
          <li><strong>Control contact-info visibility</strong> in Settings → Privacy.</li>
          <li><strong>Turn notifications on/off</strong> on your device.</li>
          <li><strong>Delete your account</strong> in Settings → Account. You can also email us to request deletion (see below). Deleting your account removes your profile and listings.</li>
        </ul>

        <h2>Data retention</h2>
        <p>We keep your information while your account is active. When you delete your account, we remove your personal data and content, except where we must keep limited records to comply with the law or resolve disputes.</p>

        <h2>Children</h2>
        <p>Habesha Community is intended for adults (18+) and is not directed at children.</p>

        <h2>Security</h2>
        <p>We use industry-standard measures (encrypted connections, hashed passwords) to protect your data. No method of transmission or storage is 100% secure, but we work to safeguard your information.</p>

        <h2>Changes to this policy</h2>
        <p>We may update this policy from time to time. We will post the new version here with an updated date.</p>

        <h2>Contact us</h2>
        <p>Questions or data requests: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>

        <p style={{ marginTop: 24 }}>
          <Link to="/terms">Terms of Use</Link> · <Link to="/">Back to home</Link>
        </p>
      </div>
      <Footer />
    </div>
  );
}
