// src/components/ExploreCategories.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../stylus/sections/Explore.module.scss";

/**
 * Infinite marquee of category cards.
 * - Background images passed via CSS var (--bg-image) to avoid url() in SCSS.
 * - Seamless loop by duplicating the items once (track scrolls -50%).
 * - Per-card Ken Burns speed + auto-contrast ink color for text.
 * - Hover pauses; reduced-motion users get manual horizontal scroll (via CSS).
 */

const img = (p) => encodeURI(p);

/* ✅ Updated to use public/explore/... image URLs */
const CATEGORIES = [
  {
    key: "housing",
    title: "Housing & Rentals",
    to: "/app/rentals",
    description: "Find rooms, flats, and friendly house shares in our community.",
    imageUrl: img("/explore/housing-rentals.jpg"),
    alt: "Welcoming home exterior with warm evening light."
  },
  {
    key: "services",
    title: "Services",
    to: "/app/services",
    description: "Tutors, movers, handymen, designers—offer or hire help.",
    imageUrl: img("/explore/services.jpg"),
    alt: "Community services icons with tools and helping hands."
  },
  {
    key: "events",
    title: "Events & Meetups",
    to: "/app/events",
    description: "Cultural nights, church events, meetups and celebrations.",
    imageUrl: img("/explore/events-meetups.jpg"),
    alt: "Community gathering with silhouettes of people and dance."
  },
  {
    key: "travel",
    title: "Travel Board",
    to: "/app/travel",
    description: "Rideshares, airport pickups, and travel buddies.",
    imageUrl: img("/explore/travel-board.jpg"),
    alt: "Airplane motif suggesting trips, luggage and journeys."
  },
  {
    key: "ads",
    title: "Classified Ads",
    to: "/app/ads",
    description: "Buy & sell items—furniture, tech, books and more.",
    imageUrl: img("/explore/classified-ads.jpg"),
    alt: "Marketplace price tags representing classifieds."
  },
  {
    key: "homeswap",
    title: "Home Swapping",
    to: "/app/home-swap",
    description: "Swap homes or rooms temporarily—save money, meet neighbours.",
    imageUrl: img("/explore/home-swapping.jpg"),
    alt: "Two houses with arrows indicating a friendly swap."
  },
];

/** Compute readable text color (white/dark) based on the card image luminance */
function useAutoInk(imageUrl) {
  const [ink, setInk] = useState("#ffffff");
  useEffect(() => {
    if (!imageUrl) return;
    const imgEl = new Image();
    imgEl.crossOrigin = "anonymous";
    imgEl.src = imageUrl;
    imgEl.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(imgEl, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
        }
        r /= n; g /= n; b /= n;
        const L = 0.2126*(r/255) + 0.7152*(g/255) + 0.0722*(b/255);
        setInk(L > 0.55 ? "#0f172a" : "#ffffff");
      } catch {
        setInk("#ffffff");
      }
    };
    imgEl.onerror = () => setInk("#ffffff");
  }, [imageUrl]);
  return ink;
}

function Card({ item, index }) {
  // Slight variation in Ken Burns per card
  const kbSpeed = useMemo(() => 18 + (index % 3) * 2, [index]);
  const ink = useAutoInk(item.imageUrl);

  return (
    <Link
      to={item.to}
      className={styles.card}
      role="listitem"
      aria-label={`${item.title} — ${item.description}`}
      draggable={false}
      style={{
        ["--kb-speed"]: `${kbSpeed}s`,
        ["--bg-image"]: `url("${item.imageUrl}")`,
      }}
    >
      <div className={styles.content} style={{ color: ink }}>
        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.desc}>{item.description}</p>
      </div>
    </Link>
  );
}

export default function ExploreCategories() {
  // Duplicate once to create a perfect seamless loop
  const marqueeItems = useMemo(() => [...CATEGORIES, ...CATEGORIES], []);
  // Speed: ~4s per original card
  const marqueeDuration = useMemo(() => `${CATEGORIES.length * 4}s`, []);

  return (
    <section className={styles.explore} aria-labelledby="explore-heading">
      <div className={styles.header}>
        <h2 id="explore-heading" className={styles.heading}>
          Explore categories
        </h2>
        <p className={styles.sub}>
          Discover postings from the Habesha community across housing, services, events and more.
        </p>
      </div>

      <div
        className={styles.marquee}
        aria-live="polite"
        aria-roledescription="marquee"
      >
        <div
          className={styles.track}
          role="list"
          style={{ ["--marquee-duration"]: marqueeDuration }}
        >
          {marqueeItems.map((item, i) => (
            <Card key={`${item.key}-${i}`} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
