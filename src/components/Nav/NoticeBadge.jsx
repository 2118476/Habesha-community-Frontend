import React from "react";
import Icon from "./Icon";

/**
 * NoticeBadge — single icon with optional numeric (or dot) badge.
 * - Capped numeric display: e.g. 100 -> "99+" (configurable via `max`, default 99)
 * - Hides when zero by default (set `showZero` to true to always show)
 * - `plainTile` removes background/border (ideal for header)
 */
export default function NoticeBadge({
  icon = "bell",
  children,
  value,
  count,
  max = 99,              // cap threshold (99 => "99+")
  variant = "count",      // "count" | "dot"
  showZero = false,
  label = "Notifications",
  tone = "accent",        // "accent" | "primary" | "danger" | "neutral"

  // sizing
  tileSize = 38,
  radius = 12,
  dotSize = 8,
  size = 18,              // icon size inside the tile

  // badge position offsets (relative to tile's top-right)
  offsetX = -2,
  offsetY = -2,

  // visuals
  plainTile = false,
  className = "",
  ...rest
}) {
  // normalize numeric input
  const raw = value ?? count;
  let n = Number(raw);
  if (!Number.isFinite(n) || n < 0) n = 0;
  n = Math.trunc(n);

  const isDot = variant === "dot";
  const overflow = n > max;
  const display = overflow ? `${max}+` : String(n);
  const showBadge = isDot ? (showZero || n > 0) : (showZero || n > 0);

  // a11y: announce the capped value
  const announce = n > 0 ? `${label}: ${display} new` : `${label}: none`;

  const srOnly = {
    position: "absolute",
    width: 1, height: 1, padding: 0, margin: -1,
    overflow: "hidden", clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap", border: 0,
  };

  const tones = {
    danger:  { bg: "#ef4444", fg: "#ffffff" },
    primary: { bg: "#3b82f6", fg: "#ffffff" }, // Blue for friends
    neutral: { bg: "#6b7280", fg: "#ffffff" },
    accent:  { bg: "#3b82f6", fg: "#ffffff" }, // Blue for messages/notifications
  };
  const palette = tones[tone] ?? tones.accent;

  // Check if we're in dark theme or hero mode (basic detection)
  const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
  const isHeroMode = document.body.getAttribute('data-hero') === 'true';

  // tile (icon background)
  const tile = plainTile
    ? {
        display: "grid",
        placeItems: "center",
        width: tileSize,
        height: tileSize,
        borderRadius: radius,
        
        // One UI 8 style semi-transparent background for header icons
        background: isHeroMode 
          ? "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 50%, rgba(255, 255, 255, 0.02) 100%)"
          : isDarkTheme
          ? "linear-gradient(135deg, rgba(10, 132, 255, 0.08) 0%, rgba(10, 132, 255, 0.04) 50%, rgba(15, 23, 42, 0.1) 100%)"
          : "linear-gradient(135deg, rgba(10, 132, 255, 0.06) 0%, rgba(10, 132, 255, 0.02) 50%, transparent 100%)",
        border: isHeroMode 
          ? "1px solid rgba(255, 255, 255, 0.2)"
          : isDarkTheme
          ? "1px solid rgba(10, 132, 255, 0.15)"
          : "1px solid rgba(10, 132, 255, 0.12)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        boxShadow: isHeroMode
          ? "0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
          : isDarkTheme
          ? "0 2px 8px rgba(10, 132, 255, 0.12), 0 1px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
          : "0 2px 8px rgba(10, 132, 255, 0.08), 0 1px 4px rgba(10, 132, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
        transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }
    : {
        display: "grid",
        placeItems: "center",
        width: tileSize,
        height: tileSize,
        borderRadius: radius,
        border: "1px solid var(--color-border, #e5e7eb)",
        background: "color-mix(in oklab, var(--surface-0, #ffffff) 88%, transparent)",
        backdropFilter: "saturate(140%) blur(6px)",
        WebkitBackdropFilter: "saturate(140%) blur(6px)",
        boxShadow: "0 1px 2px rgba(0,0,0,.06)",
        transition: "transform .15s ease",
      };

  const iconNode =
    children ?? (
      <Icon
        name={icon}
        width={size}
        height={size}
        strokeWidth={1.75}
        aria-hidden="true"
      />
    );

  const badgeMinW = 18;
  const badgeH = 18;

  return (
    <span
      className={`hc-notice-badge ${className}`}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      aria-live="polite"
      aria-atomic="true"
      aria-label={label}
      data-tone={tone}
      data-count={n}
      data-display={display}
      data-overflow={overflow ? "true" : "false"}
      {...rest}
    >
      <span style={tile}>{iconNode}</span>

      {showBadge && (
        <span
          role="status"
          title={n > 0 ? `${display} new` : "No new"}
          data-variant={variant}
          data-count={n}
          data-display={display}
          style={{
            position: "absolute",
            top: offsetY,
            right: offsetX,
            minWidth: isDot ? dotSize : badgeMinW,
            height: isDot ? dotSize : badgeH,
            padding: isDot ? 0 : "0 6px",
            borderRadius: 9999,
            fontSize: isDot ? 0 : 11,
            lineHeight: isDot ? `${dotSize}px` : `${badgeH}px`,
            textAlign: "center",
            fontWeight: 700,
            background: palette.bg,
            color: palette.fg,
            boxShadow: "0 1px 2px rgba(0,0,0,.25)",
            transform: "translateZ(0)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {isDot ? null : display}
        </span>
      )}

      <span style={srOnly}>{announce}</span>
    </span>
  );
}
