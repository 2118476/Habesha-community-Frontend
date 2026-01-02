import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosInstance';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import styles from '../stylus/sections/PublicContact.module.scss';
import Footer from '../layout/Footer';

/**
 * PublicContact renders a simple contact form allowing visitors or
 * authenticated users to reach out to the Habesha Community team. It
 * collects a name, email and message. If the user is logged in the
 * email field is prefilled with their account email (read only). On
 * submit the form posts to the configured contact endpoint. Should
 * the request fail (e.g. unauthenticated users when the backend
 * requires auth) it falls back to a mailto link defined via an
 * environment variable.
 */
const PublicContact = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const endpoint = process.env.REACT_APP_CONTACT_ENDPOINT || '/contact/request';
  const fallbackMailto = process.env.REACT_APP_CONTACT_FALLBACK_MAILTO || 'mailto:admin@example.com';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please complete all fields');
      return;
    }
    setSubmitting(true);
    try {
      // naive payload; backend should decide what to do with extra fields
      await api.post(endpoint, { name: name.trim(), email: email.trim(), message: message.trim() });
      toast.success('Thanks for getting in touch! We will respond soon.');
      setMessage('');
    } catch (err) {
      console.warn('Contact submit failed', err);
      toast.error('Unable to send message via API. Opening your mail client…');
      // open mailto fallback
      window.location.href = `${fallbackMailto}?subject=Habesha%20Community%20Contact&body=${encodeURIComponent(message.trim())}`;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className={styles.container}>
        <h1>Contact Us</h1>
        <p>
          We’d love to hear from you! Whether you have feedback, a question or
          want to report an issue, please fill out the form below. We’ll get
          back to you as soon as possible.
        </p>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.fieldGroup}>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('contact.namePlaceholder')}
              required
            />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('contact.emailPlaceholder')}
              required
              readOnly={!!user}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('contact.messagePlaceholder')}
              rows={6}
              required
            />
          </div>
          <button type="submit" disabled={submitting} className={styles.submitBtn}>
            {submitting ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default PublicContact;