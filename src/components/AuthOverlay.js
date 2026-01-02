import React from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import modalStyles from '../stylus/components/Modal.module.scss';

// Displays a full‑screen backdrop with the login or registration form
// centred on the page. Clicking the backdrop closes the modal and
// returns the user to the previous location. An optional mode
// determines whether to render the login or register form.
const AuthOverlay = ({ mode }) => {
  const navigate = useNavigate();

  const handleClose = (e) => {
    // Prevent closing if clicking inside the modal
    if (e.target !== e.currentTarget) return;
    navigate(-1);
  };

  return (
    <div className={modalStyles.backdrop} onClick={handleClose}>
      <div className={modalStyles.modal} role="dialog" aria-modal="true">
        {mode === 'register' ? <Register /> : <Login />}
      </div>
    </div>
  );
};

export default AuthOverlay;