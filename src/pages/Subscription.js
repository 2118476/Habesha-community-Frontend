import React from 'react';
import api from '../api/axiosInstance';
import { toast } from 'react-toastify';

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
    <div>
      <h2>Habesha Pro Subscription</h2>
      <p>Choose a plan to unlock advanced features.</p>
      <div className="subscription-plans">
        <button onClick={() => subscribe('monthly')} className="btn-primary">
          Monthly Plan
        </button>
        <button onClick={() => subscribe('yearly')} className="btn-primary">
          Yearly Plan
        </button>
      </div>
    </div>
  );
};

export default SubscriptionPage;