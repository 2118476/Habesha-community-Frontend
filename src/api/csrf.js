// frontend/src/api/csrf.js
import api from "./axiosInstance";

/** Touch the CSRF endpoint to ensure cookies are set (if your backend uses it). */
export async function ensureCsrf() {
  try {
    await api.get("/csrf");
  } catch {
    // swallow — some setups don't expose /csrf for GET
  }
}
