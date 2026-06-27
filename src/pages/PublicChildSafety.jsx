import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../stylus/sections/PublicAbout.module.scss';
import Footer from '../layout/Footer';

/**
 * Public, login-free Child Safety Standards (CSAE) statement. Reachable at
 * /child-safety so it can be used as the Google Play "Safety standards URL"
 * required for apps in the Social category.
 */
const CONTACT_EMAIL = 'mihretabtesfahun2124@gmail.com';

export default function PublicChildSafety() {
  return (
    <div>
      <div className={styles.container}>
        <h1>Child Safety Standards</h1>
        <p><em>Last updated: June 2026</em></p>

        <p>
          <strong>UK Habesha</strong> has <strong>zero tolerance</strong> for child sexual abuse
          and exploitation (CSAE) and child sexual abuse material (CSAM). Protecting children is a
          responsibility we take extremely seriously. This page sets out our standards and the steps
          we take to keep our community safe.
        </p>

        <h2>An adults-only community</h2>
        <p>
          UK Habesha is intended <strong>only for adults aged 18 and over</strong>. The app is not
          directed at children, and accounts are required to be held by adults. We do not knowingly
          allow anyone under 18 to create an account or use the service.
        </p>

        <h2>What is strictly prohibited</h2>
        <ul>
          <li>Any content, link or behaviour that sexualises, exploits, endangers or abuses a minor.</li>
          <li>Child sexual abuse material (CSAM) of any kind.</li>
          <li>Grooming, solicitation, or attempting to contact or meet a minor for sexual purposes.</li>
          <li>Trafficking, endangerment, or any other form of harm to a child.</li>
        </ul>

        <h2>How to report a child safety concern</h2>
        <p>
          Anyone can report a concern. Inside the app, use the <strong>Report</strong> option on a
          profile or a listing, or <strong>block</strong> the user. You can also email us directly at{' '}
          <a href={`mailto:${CONTACT_EMAIL}?subject=Child%20safety%20report`}>{CONTACT_EMAIL}</a>.
          Reports are reviewed by our moderation team.
        </p>

        <h2>How we respond</h2>
        <ul>
          <li>We promptly review reports and <strong>remove</strong> any violating content.</li>
          <li>We <strong>suspend and ban</strong> accounts involved in CSAE, and preserve relevant evidence.</li>
          <li>We <strong>report</strong> apparent child sexual abuse material to the appropriate
            authorities, including the National Center for Missing &amp; Exploited Children (NCMEC) and,
            in the United Kingdom, the Internet Watch Foundation (IWF) and law enforcement.</li>
          <li>We cooperate with law enforcement requests as required by law.</li>
        </ul>

        <h2>Compliance</h2>
        <p>
          We comply with all applicable child safety laws and reporting obligations in the regions
          where the app is available, and we align our practices with Google Play’s child safety
          standards policy.
        </p>

        <h2>Child safety point of contact</h2>
        <p>
          For any child safety matter, contact our designated point of contact at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We aim to respond promptly.
        </p>

        <p style={{ marginTop: 24 }}>
          <Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms of Use</Link> · <Link to="/">Back to home</Link>
        </p>
      </div>
      <Footer />
    </div>
  );
}
