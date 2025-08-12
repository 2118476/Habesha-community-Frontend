import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ToastProvider encapsulates the ToastContainer from react‑toastify
// and defines default positioning and behaviour. Include this
// component once near the top level of your app to enable toast
// notifications throughout the UI.
const ToastProvider = () => (
  <ToastContainer
    position="top-right"
    autoClose={3000}
    hideProgressBar={false}
    newestOnTop
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
  />
);

export default ToastProvider;