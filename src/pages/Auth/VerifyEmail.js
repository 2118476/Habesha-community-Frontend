import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(
          err.response?.data?.message || 'Verification failed. The link may have expired.'
        );
      });
  }, [token]);

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

        {status === 'success' && (
          <>
            <div className="verify-icon success">✓</div>
            <h2>Email Verified</h2>
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
            <button className="verify-btn" onClick={() => navigate('/login')}>
              Go to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
