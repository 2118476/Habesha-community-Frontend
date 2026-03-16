import React from "react";

/**
 * Habesha Community logo — a clean house icon with a heart
 * inside, representing community and home. Sits on the
 * brand gradient rounded-square badge.
 */
export default function HCLogo({ size = 30, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-label="Habesha Community logo"
      role="img"
    >
      {/* Rounded-square background */}
      <rect x="2" y="2" width="96" height="96" rx="22" fill="url(#hc-bg3)" />

      {/* House roof */}
      <path
        d="M50 18 L16 48 H26 V78 H74 V48 H84 Z"
        fill="none"
        stroke="#fff"
        strokeWidth="5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Door */}
      <rect x="42" y="58" width="16" height="20" rx="2" fill="#fff" opacity="0.35" />

      {/* Heart inside the house — community */}
      <path
        d="M50 55 C50 55 42 47 42 42 C42 38 46 36 50 40 C54 36 58 38 58 42 C58 47 50 55 50 55Z"
        fill="#f59e0b"
      />

      <defs>
        <linearGradient id="hc-bg3" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  );
}
