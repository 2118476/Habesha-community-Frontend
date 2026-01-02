import React from 'react';
import api from '../api/axiosInstance';
import { toast } from 'react-toastify';
// Import design system styles
import styles from '../stylus/sections/Subscription.module.scss';
import buttonStyles from '../stylus/components/Button.module.scss';

// Page offering subscription plans. When clicked, a request is
// sent to the backend to create a Stripe checkout session. The
// user is then redirected to the Stripe hosted page.
const SubscriptionPage = () => {
  const subscribe = async (tier) => {
    try {
      // Create a payment session for a subscription. Provide the required
      // fields expected by the backend: type, targetId, success and cancel URLs.
      const successUrl = window.location.origin + '/subscription';
      const cancelUrl = window.location.origin + '/subscription';
      const { data } = await api.post('/payments/session', {
        type: 'SUBSCRIPTION',
        targetId: tier === 'yearly' ? 2 : 1,
        successUrl,
        cancelUrl,
      });
      // The backend returns a URL for Stripe checkout. Redirect the
      // browser directly to this URL instead of relying on session IDs.
      window.location.href = data.url;
    } catch {
      toast.error('Failed to initiate subscription');
    }
  };

  return (
    <div className={styles.container}>
      <h2 style={{ marginTop: 0 }}>Habesha Pro Subscription</h2>
      <p>Choose a plan to unlock advanced features.</p>
      <div className={styles.plans}>
        <div className="section" style={{ padding: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Monthly Plan</h3>
          <p style={{ marginBottom: '0.75rem' }}>Pay monthly and enjoy premium features.</p>
          <button
            onClick={() => subscribe('monthly')}
            className={`${buttonStyles.btn} ${buttonStyles.primary}`}
          >
            Subscribe for £x/month
          </button>
        </div>
        <div className="section" style={{ padding: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Yearly Plan</h3>
          <p style={{ marginBottom: '0.75rem' }}>Save more with an annual subscription.</p>
          <button
            onClick={() => subscribe('yearly')}
            className={`${buttonStyles.btn} ${buttonStyles.primary}`}
          >
            Subscribe for £y/year
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;