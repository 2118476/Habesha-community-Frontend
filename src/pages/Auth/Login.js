import React from 'react';
import { useLocation } from 'react-router-dom';
import Account from '../../features/auth/Account';
import PublicNavbar from '../../public/PublicNavbar';

/**
 * Login page which wraps the Account component.
 * We propagate any ?redirect=/path so the user lands where they intended.
 */
const Login = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect') || '/app/home';
  return <Account initialSignUp={false} redirect={redirect} />;
};

export default Login;