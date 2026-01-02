import React from 'react';
const FormError = ({ message }) => {
  if (!message) return null;
  return <div role="alert" style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: 4 }}>{message}</div>;
};
export default FormError;
