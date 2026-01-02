// src/api/authReset.js
import api from "./axiosInstance";

/**
 * Request password reset for the given email address.
 * Uses the /auth/forgot-password endpoint.
 */
export async function requestPasswordReset(email) {
  try {
    const response = await api.post("/auth/forgot-password", { email });
    return response;
  } catch (error) {
    console.error("Password reset request failed:", error);
    throw error;
  }
}

/**
 * Submit a new password using the reset token.
 * Uses the /auth/reset-password endpoint with token and newPassword.
 */
export async function submitNewPassword(token, newPassword) {
  try {
    const response = await api.post("/auth/reset-password", { 
      token, 
      newPassword 
    });
    return response;
  } catch (error) {
    console.error("Password reset failed:", error);
    throw error;
  }
}
