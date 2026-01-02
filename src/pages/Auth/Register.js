import React from 'react';
import { useLocation } from 'react-router-dom';
import Account from '../../features/auth/Account';

/**
 * Registration page reusing the Account component (signup view).
 */
const Register = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect') || '/login';
  return <Account initialSignUp={true} redirect={redirect} />;
};

export default Register;