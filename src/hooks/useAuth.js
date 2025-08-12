import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// Custom hook to consume the AuthContext. Using this hook
// simplifies importing useContext and provides type safety.
export default function useAuth() {
  return useContext(AuthContext);
}