// src/pages/Settings/hooks/useUserSettings.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../../../api/axiosInstance";

const DEBOUNCE_MS = 450;

/**
 * Simple debounce that always uses the latest function via ref.
 */
function useDebouncedCallback(fn, delay) {
  const fnRef = useRef(fn);
  const timerRef = useRef(null);
  useEffect(() => { fnRef.current = fn; }, [fn]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const debounced = useCallback((...args) => {
    cancel();
    timerRef.current = setTimeout(() => {
      fnRef.current(...args);
    }, delay);
  }, [cancel, delay]);

  // cancel on unmount
  useEffect(() => cancel, [cancel]);

  return { debounced, cancel };
}

/**
 * useUserSettings
 * - Loads /api/users/me/settings on mount
 * - Exposes `settings`, `update(partial)`, `saving`, `error`, `reload()`
 * - `update(partial)` merges locally and debounced-PUTs the *partial* only
 */
export default function useUserSettings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get("/api/users/me/settings");
      setSettings(data || {});
    } catch (e) {
      setError(e);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/api/users/me/settings");
        if (alive) setSettings(data || {});
      } catch (e) {
        if (alive) setError(e);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Debounced PUT for partial updates
  const { debounced: debouncedSave } = useDebouncedCallback(
    async (partial) => {
      try {
        setSaving(true);
        await api.put("/api/users/me/settings", partial);
      } finally {
        setSaving(false);
      }
    },
    DEBOUNCE_MS
  );

  /**
   * Merge a partial into the local model and persist that partial.
   * Example: update({ theme: "DARK" }) or update({ notifications: {...} })
   */
  const update = useCallback((partial) => {
    setSettings((prev) => {
      const next = { ...(prev || {}), ...partial };
      return next;
    });
    debouncedSave(partial);
  }, [debouncedSave]);

  return useMemo(
    () => ({
      settings,
      update,
      saving,
      error,
      reload: load,
    }),
    [settings, update, saving, error, load]
  );
}
