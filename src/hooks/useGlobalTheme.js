// src/hooks/useGlobalTheme.js
import { useEffect } from "react";
import api from "../api/axiosInstance";
import useAuth from "./useAuth";
import { applyTheme, applyFontScale, applyDensity, applyReducedMotion } from "../pages/Settings/utils/theme";

/**
 * Global theme hook that applies user settings on app startup.
 * Only fetches settings from the API when the user is authenticated,
 * avoiding 403 errors on public pages like the auth screen.
 */
export default function useGlobalTheme() {
  const { token } = useAuth();

  useEffect(() => {
    let mounted = true;

    // No token → apply defaults silently, skip the network call entirely.
    if (!token) {
      applyTheme("LIGHT");
      applyFontScale("DEFAULT");
      applyDensity("COMFORTABLE");
      applyReducedMotion(false);
      return;
    }

    const loadAndApplySettings = async () => {
      try {
        const { data } = await api.get("/api/users/me/settings");

        if (!mounted) return;

        if (data) {
          applyTheme(data.theme || "LIGHT");
          applyFontScale(data.fontScale || "DEFAULT");
          applyDensity(data.density || "COMFORTABLE");
          applyReducedMotion(data.reducedMotion || false);
        }
      } catch {
        // Settings unavailable — fall back to defaults quietly.
        if (mounted) {
          applyTheme("LIGHT");
          applyFontScale("DEFAULT");
          applyDensity("COMFORTABLE");
          applyReducedMotion(false);
        }
      }
    };

    loadAndApplySettings();

    return () => {
      mounted = false;
    };
  }, [token]);
}
