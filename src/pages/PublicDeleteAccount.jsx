import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../stylus/sections/PublicAbout.module.scss';
import Footer from '../layout/Footer';

/**
 * Public, login-free account & data deletion instructions. Reachable at
 * /delete-account so it can be used as the Google Play Data Safety
 * "Delete account URL" and "Delete data URL".
 */
const CONTACT_EMAIL = 'mihretabtesfahun2124@gmail.com';

export default function PublicDeleteAccount() {
  return (
    <div>
      <div className={styles.container}>
        <h1>Delete your account &amp; data</h1>
        <p><em>Last updated: June 2026</em></p>

        <p>
          This page explains how to delete your <strong>UK Habesha</strong> account and
          the personal data associated with it, or how to delete specific content
          without closing your account.
        </p>

        <h2>Delete your whole account</h2>
        <p>You can request deletion of your account from inside the app:</p>
        <ol>
          <li>Sign in to <strong>UK Habesha</strong>.</li>
          <li>Go to <strong>Settings → Account</strong>.</li>
          <li>Tap <strong>Delete Account</strong> and confirm.</li>
          <li>Your request is submitted for review and your account is then removed.</li>
        </ol>
        <p>
          If you cannot access the app, you can email us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}?subject=Delete my UK Habesha account`}>{CONTACT_EMAIL}</a>{' '}
          from the email address on your account and we will action the deletion for you.
        </p>

        <h2>Delete specific data (without closing your account)</h2>
        <p>You can remove individual data at any time while keeping your account:</p>
        <ul>
          <li><strong>Listings &amp; posts</strong> — open the item (rental, service, event, travel, home swap or marketplace ad) and choose <strong>Delete</strong>.</li>
          <li><strong>Messages</strong> — delete a message from the conversation.</li>
          <li><strong>Profile photo &amp; bio</strong> — remove or edit them in <strong>Settings → Account</strong>.</li>
          <li><strong>Phone number &amp; other details</strong> — edit or clear them in <strong>Settings</strong>.</li>
        </ul>

        <h2>What is deleted</h2>
        <p>
          When you delete your account, we remove your personal information (name,
          email, phone number, profile photo and bio) and the content you created
          (listings, photos, reviews and messages).
        </p>

        <h2>What we may keep, and for how long</h2>
        <p>
          We keep your information only while your account is active. After deletion we
          remove your personal data and content, except where we must keep limited
          records for a longer period to comply with the law, prevent fraud or resolve
          disputes. Such records are kept only as long as legally required and are then
          deleted.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about deletion: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>

        <p style={{ marginTop: 24 }}>
          <Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms of Use</Link> · <Link to="/">Back to home</Link>
        </p>
      </div>
      <Footer />
    </div>
  );
}
