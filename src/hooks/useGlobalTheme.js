// src/hooks/useGlobalTheme.js
import { useEffect } from "react";
import api from "../api/axiosInstance";
import { applyTheme, applyFontScale, applyDensity, applyReducedMotion } from "../pages/Settings/utils/theme";

/**
 * Global theme hook that applies user settings on app startup
 * This ensures theme, font scale, and other display settings are applied
 * across the entire app, not just on the Settings page.
 */
export default function useGlobalTheme() {
  useEffect(() => {
    let mounted = true;

    const loadAndApplySettings = async () => {
      try {
        const { data } = await api.get("/api/users/me/settings");
        
        if (!mounted) return;
        
        // Apply all display settings globally
        if (data) {
          applyTheme(data.theme || "SYSTEM");
          applyFontScale(data.fontScale || "DEFAULT");
          applyDensity(data.density || "COMFORTABLE");
          applyReducedMotion(data.reducedMotion || false);
        }
      } catch (error) {
        // If settings can't be loaded (e.g., user not authenticated),
        // apply default settings silently
        if (mounted) {
          applyTheme("SYSTEM");
          applyFontScale("DEFAULT");
          applyDensity("COMFORTABLE");
          applyReducedMotion(false);
        }
      }
    };

    // Apply settings immediately
    loadAndApplySettings();

    return () => {
      mounted = false;
    };
  }, []);
}