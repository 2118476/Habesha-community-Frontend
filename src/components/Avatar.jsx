// src/components/Avatar.jsx
import React, { useMemo, useState, useEffect } from "react";
import styles from "./Avatar.module.scss";
import { avatarSrcFrom } from "../utils/avatar";
import useAuth from "../hooks/useAuth";

function initialsFrom(name) {
  const s = (name || "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

/* Warm, on-brand palette for default avatars (Facebook/Google style). */
const AVATAR_COLORS = [
  "#1b7a4b", "#c4861a", "#c0392b", "#2c7da0",
  "#7b4bb7", "#b5651d", "#0f766e", "#9333ea", "#1e6091",
];

function colorFromName(name) {
  const s = (name || "?").trim();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initialsDataUrl(initials, bg) {
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>
      <rect width='100%' height='100%' fill='${bg}'/>
      <text x='50%' y='50%' dy='.06em' dominant-baseline='middle' text-anchor='middle'
            font-family='Inter,system-ui,Arial' font-weight='600' font-size='34' fill='#ffffff'>${initials}</text>
    </svg>`
  );
  return `data:image/svg+xml;charset=UTF-8,${svg}`;
}

export default function Avatar({
  user,            // user object or "me"
  src,             // explicit image URL
  url,             // legacy alias for src
  username,        // optional explicit username for alt
  displayName,     // optional explicit displayName for alt
  size = "md",     // number or token: xs | sm | md | lg | xl
  alt,
  rounded = true,
  className = "",
  onClick,
}) {
  const { user: me } = useAuth();
  const u = user === "me" ? me : user;

  const sizeMap = { xs: 24, sm: 32, md: 40, lg: 56, xl: 72 };
  const sizePx = typeof size === "number" ? size : sizeMap[size] ?? 40;

  // Prefer explicit src, then legacy url, then infer from user object
  const preferredSrc = useMemo(() => {
    const aliased = src || url;
    if (aliased) return avatarSrcFrom(aliased);
    if (u) return avatarSrcFrom(u);
    return "";
  }, [src, url, u]);

  const altText = useMemo(() => {
    return (
      alt ||
      displayName ||
      username ||
      u?.displayName ||
      u?.name ||
      u?.fullName ||
      u?.username ||
      "User avatar"
    );
  }, [alt, displayName, username, u?.displayName, u?.name, u?.fullName, u?.username]);

  const fallbackDataUrl = useMemo(
    () => initialsDataUrl(initialsFrom(altText), colorFromName(altText)),
    [altText]
  );

  const [imgSrc, setImgSrc] = useState(preferredSrc || fallbackDataUrl);

  useEffect(() => {
    setImgSrc(preferredSrc || fallbackDataUrl);
  }, [preferredSrc, fallbackDataUrl]);

  return (
    <img
      src={imgSrc}
      alt={altText}
      width={sizePx}
      height={sizePx}
      className={[
        styles.avatar,
        rounded ? styles.rounded : "",
        className,
      ].join(" ").trim()}
      style={{ width: sizePx, height: sizePx }}
      onError={() => {
        if (imgSrc !== fallbackDataUrl) setImgSrc(fallbackDataUrl);
      }}
      onClick={onClick}
    />
  );
}
