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

function initialsDataUrl(initials) {
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
      <rect width='100%' height='100%' fill='#E5E7EB'/>
      <text x='50%' y='50%' dominant-baseline='central' text-anchor='middle'
            font-family='Inter,system-ui,Arial' font-size='28' fill='#374151'>${initials}</text>
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
    () => initialsDataUrl(initialsFrom(altText)),
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
