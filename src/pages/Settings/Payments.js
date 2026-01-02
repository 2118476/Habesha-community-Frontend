import React from 'react';

/**
 * PaymentsSettings lists the user's saved payment methods and payment
 * history. Because payment integration is not yet implemented, this
 * page displays a read‑only message.
 */
const PaymentsSettings = () => {
  return (
    <div>
      <h2>Payments</h2>
      <p>Your payment methods and history will appear here once payments
        integration is available.</p>
    </div>
  );
};

export default PaymentsSettings;