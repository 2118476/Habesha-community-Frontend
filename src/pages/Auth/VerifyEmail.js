import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying'); // verifying | success | error | already
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified. You can now sign in.');
      })
      .catch((err) => {
        const msg = err.response?.data?.message || '';
        if (msg.toLowerCase().includes('already')) {
          setStatus('already');
          setMessage('Your email is already verified. You can sign in.');
        } else {
          setStatus('error');
          setMessage(msg || 'Verification failed. The link may have expired.');
        }
      });
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) return;
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: resendEmail });
      setMessage('A new verification link has been sent to your email.');
      setStatus('success');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-email-page">
      <div className="verify-email-card">
        {status === 'verifying' && (
          <>
            <div className="verify-spinner" />
            <h2>Verifying your email...</h2>
            <p>Please wait a moment.</p>
          </>
        )}

        {(status === 'success' || status === 'already') && (
          <>
            <div className="verify-icon success">✓</div>
            <h2>{status === 'already' ? 'Already Verified' : 'Email Verified'}</h2>
            <p>{message}</p>
            <button className="verify-btn" onClick={() => navigate('/login')}>
              Sign In
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="verify-icon error">✕</div>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <div className="verify-resend">
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                Enter your email to receive a new verification link:
              </p>
              <input
                type="email"
                className="verify-resend-input"
                placeholder="your@email.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
              />
              <button
                className="verify-btn verify-btn-outline"
                onClick={handleResend}
                disabled={resending || !resendEmail}
              >
                {resending ? 'Sending...' : 'Resend Verification'}
              </button>
            </div>
            <button className="verify-btn" onClick={() => navigate('/login')} style={{ marginTop: '0.75rem' }}>
              Go to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
