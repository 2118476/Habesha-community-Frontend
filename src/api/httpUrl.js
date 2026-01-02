import api from "./axiosInstance";

/** Normalized baseURL from axios (no trailing slash) */
export const apiBase =
  (api?.defaults?.baseURL ? api.defaults.baseURL.replace(/\/+$/, "") : "") || "";

/** Ensure a path like "/rentals/1/photos/first" becomes absolute. */
export function makeApiUrl(pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== "string") return "";
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith("data:")) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${apiBase}${path}`;
}
