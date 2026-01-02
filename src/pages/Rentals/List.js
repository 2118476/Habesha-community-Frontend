// src/pages/Rentals/List.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { listRentals } from "../../api/rentals";
import { makeApiUrl } from "../../api/httpUrl";

import styles from "../../stylus/sections/Rentals.module.scss";
import buttonStyles from "../../stylus/components/Button.module.scss";

/* ==========================================================================
   CONFIG / CONSTANTS
   ========================================================================== */

const PAGE_SIZE = 12;
const FALLBACK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

/* ==========================================================================
   SMALL HELPERS
   ========================================================================== */

/** cheap debounce so typing in filters doesn’t lag the UI */
const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

/** format a monthly rent number into £1,200 style */
function formatPrice(v) {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return `£${n.toLocaleString("en-GB")}`;
}

/** “Today” / “1 day ago” / “5 days ago” badge */
function daysAgo(dateStr, t) {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  if (!then || Number.isNaN(then)) return null;
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return t("common.today");
  if (diffDays === 1) return t("rentals.oneDayAgo");
  return t("rentals.daysAgo", { count: diffDays });
}

/** be defensive: different APIs might use different id keys */
function resolveRentalId(item) {
  return (
    item?.id ??
    item?.rentalId ??
    item?.listingId ??
    item?.publicId ??
    item?.uuid ??
    item?._id ??
    null
  );
}

/* ==========================================================================
   LIST CARD (single rental tile)
   ========================================================================== */

function RentalCard({ item }) {
  const { t } = useTranslation();
  const cardRef = useRef(null); // observed for lazy-load images
  const [visible, setVisible] = useState(false);

  const [imgSrc, setImgSrc] = useState(FALLBACK_PIXEL);
  const [imgAttempt, setImgAttempt] = useState("initial"); // initial -> fallbackFirst -> pixel

  // figure out stable id + metadata
  const rentalId = resolveRentalId(item);
  const nicePrice = formatPrice(item.price);
  const postedWhen = daysAgo(item.createdAt, t);
  const typeLabel = item.roomType || item.room_type || null;

  // --- IMAGE SOURCE STRATEGY (fresh cover) ---------------------------------
  //
  // We do NOT trust item.firstPhotoUrl anymore because it can be stale after
  // editing/deleting photos. Instead we always point at the canonical "first"
  // photo endpoint, plus a cache-buster query so the browser doesn’t reuse an
  // old thumbnail.
  //
  // /rentals/{id}/photos/first  <-- backend should return the current cover
  //
  // If that fails, we fall back to a 1px pixel.
  //
  useEffect(() => {
    if (!rentalId) {
      setImgSrc(FALLBACK_PIXEL);
      return;
    }

    // fresh URL with cache-buster, so after edit/delete we see new image immediately
    const freshUrl = makeApiUrl(
      `/rentals/${encodeURIComponent(rentalId)}/photos/first?ts=${Date.now()}`
    );

    setImgAttempt("initial");
    setImgSrc(freshUrl);
  }, [rentalId]);

  /** if thumbnail fails to load, final fallback = transparent pixel */
  function handleImageError() {
    if (imgAttempt === "initial") {
      // try again without cache buster just in case (rare CDN edge case)
      const plainUrl = rentalId
        ? makeApiUrl(
            `/rentals/${encodeURIComponent(rentalId)}/photos/first`
          )
        : FALLBACK_PIXEL;
      setImgAttempt("fallbackFirst");
      setImgSrc(plainUrl || FALLBACK_PIXEL);
      return;
    }
    // last resort -> pixel
    if (imgAttempt === "fallbackFirst") {
      setImgAttempt("pixel");
      setImgSrc(FALLBACK_PIXEL);
    }
  }

  // --- LAZY REVEAL ---------------------------------------------------------
  //
  // We don’t actually render <img> until the card is near viewport,
  // to save data / improve scroll perf on mobile.
  //
  const [shouldRenderImg, setShouldRenderImg] = useState(false);
  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          setShouldRenderImg(true);
          io.disconnect();
        }
      },
      { rootMargin: "250px 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  // link target for clicking a card
  const detailsHref = rentalId
    ? `/app/rentals/${encodeURIComponent(rentalId)}`
    : "#";

  return (
    <Link to={detailsHref} className={styles.card} ref={cardRef}>
      {/* ====== PHOTO / PRICE TAG ====== */}
      <div className={styles.cardMedia}>
        {shouldRenderImg ? (
          <img
            src={imgSrc}
            alt={item.title || t("rentals.rental")}
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <div className={styles.skeletonThumb} />
        )}

        {nicePrice && (
          <div className={styles.priceTag}>
            {nicePrice}
            <span className={styles.priceSuffix}>/{t("rentals.perMonth")}</span>
          </div>
        )}

        {item.featured && (
          <div className={styles.featureTag}>{t("rentals.featured")}</div>
        )}
      </div>

      {/* ====== TEXT BODY ====== */}
      <div className={styles.cardBody}>
        <h3
          className={styles.cardTitle}
          title={item.title || t("rentals.untitledListing")}
        >
          {item.title || t("rentals.untitledListing")}
        </h3>

        <div className={styles.cardSub}>
          {item.location || "—"}
        </div>

        <div className={styles.badgeRow}>
          {typeLabel && (
            <span className={styles.badge}>{typeLabel}</span>
          )}
          {postedWhen && (
            <span className={styles.badgeMuted}>{postedWhen}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ==========================================================================
   SKELETON CARD (loading shimmer)
   ========================================================================== */

function SkeletonCard() {
  return (
    <div className={`${styles.card} ${styles.skeletonCard}`}>
      <div className={styles.skeletonThumb} />
      <div className={styles.cardBody}>
        <div
          className={styles.skeletonLine}
          style={{ width: "70%" }}
        />
        <div
          className={styles.skeletonLine}
          style={{ width: "45%" }}
        />
        <div className={styles.skeletonChipRow}>
          <div className={styles.skeletonChip} />
          <div className={styles.skeletonChip} />
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   MAIN PAGE COMPONENT
   ========================================================================== */

export default function RentalsList() {
  const { t } = useTranslation();
  
  // raw data from API
  const [raw, setRaw] = useState([]);

  // loading state
  const [loading, setLoading] = useState(true);

  // filters / sort state
  const [kw, setKw] = useState(""); // keyword in title
  const [area, setArea] = useState(""); // part of location
  const [min, setMin] = useState(""); // numeric
  const [max, setMax] = useState(""); // numeric
  const [roomFilter, setRoomFilter] = useState("any"); // any|room|studio|flat|house
  const [sort, setSort] = useState("newest"); // newest|priceAsc|priceDesc

  // pagination
  const [page, setPage] = useState(1);

  // initial fetch
  useEffect(() => {
    (async () => {
      try {
        const data = await listRentals();
        setRaw(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // debounced inputs
  const onKeywordChange = useMemo(
    () =>
      debounce((val) => {
        setKw(val);
        setPage(1);
      }, 250),
    []
  );

  const onAreaChange = useMemo(
    () =>
      debounce((val) => {
        setArea(val);
        setPage(1);
      }, 250),
    []
  );

  // filter + sort in-memory
  const filtered = useMemo(() => {
    const kwLc = kw.trim().toLowerCase();
    const areaLc = area.trim().toLowerCase();
    const minN = min ? Number(min) : null;
    const maxN = max ? Number(max) : null;
    const requestedType = roomFilter === "any" ? null : roomFilter;

    let arr = raw.filter((r) => {
      const titleLc = (r.title || "").toLowerCase();
      const locLc = (r.location || "").toLowerCase();
      const typeLc = (r.roomType || r.room_type || "").toLowerCase();
      const priceNum =
        r.price != null && !Number.isNaN(Number(r.price))
          ? Number(r.price)
          : null;

      const matchKw = !kwLc || titleLc.includes(kwLc);
      const matchArea = !areaLc || locLc.includes(areaLc);
      const matchType = !requestedType || typeLc === requestedType;
      const okMin = minN == null || (priceNum != null && priceNum >= minN);
      const okMax = maxN == null || (priceNum != null && priceNum <= maxN);

      return matchKw && matchArea && matchType && okMin && okMax;
    });

    // sort by selected mode
    if (sort === "newest") {
      arr = arr.sort(
        (a, b) =>
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    } else if (sort === "priceAsc") {
      arr = arr.sort(
        (a, b) =>
          (Number(a.price) || Infinity) -
          (Number(b.price) || Infinity)
      );
    } else if (sort === "priceDesc") {
      arr = arr.sort(
        (a, b) =>
          (Number(b.price) || -Infinity) -
          (Number(a.price) || -Infinity)
      );
    }

    return arr;
  }, [raw, kw, area, min, max, roomFilter, sort]);

  // "visible page" slice (load more pagination)
  const visible = useMemo(
    () => filtered.slice(0, page * PAGE_SIZE),
    [filtered, page]
  );

  // header stats text
  const headerCountText = useMemo(() => {
    const c = filtered.length;
    if (c === 0) return t("rentals.noListings");
    if (c === 1) return t("rentals.onePlace");
    return t("rentals.placesCount", { count: c });
  }, [filtered.length, t]);

  /* ------------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------------ */

  return (
    <div className={styles.wrapper}>
      {/* ===== Header row: title + CTA ===== */}
      <div className={styles.headerRow}>
        <div className={styles.headerTextBlock}>
          <h1 className={styles.marketHeading}>{t("rentals.rentals")}</h1>
          <div className={styles.marketSub}>
            <span>{headerCountText}</span>
            <span className={styles.dotSep} aria-hidden>
              ·
            </span>
            <span>
              {sort === "newest"
                ? t("rentals.newestFirst")
                : sort === "priceAsc"
                ? t("rentals.cheapestFirst")
                : t("rentals.mostExpensiveFirst")}
            </span>
          </div>
        </div>

        <Link
          to="/app/rentals/post"
          className={`${buttonStyles.btn} ${buttonStyles.primary}`}
        >
          {t("rentals.postRental")}
        </Link>
      </div>

      {/* ===== Layout: Filters (left) + Results (right) ===== */}
      <div className={styles.layout}>
        {/* ---------- FILTERS COLUMN ---------- */}
        <aside className={styles.filtersCol}>
          <div className={styles.filtersCard}>
            {/* Keyword filter */}
            <div className={styles.filterBlock}>
              <label
                htmlFor="kwInput"
                className={styles.filterLabel}
              >
                {t("rentals.searchKeywords")}
              </label>
              <input
                id="kwInput"
                type="text"
                placeholder={t("rentals.keywordsPlaceholder")}
                defaultValue={kw}
                onChange={(e) => onKeywordChange(e.target.value)}
                className={styles.filterInput}
              />
              <div className={styles.filterHint}>
                {t("rentals.searchInTitle")}
              </div>
            </div>

            {/* Area / Location filter */}
            <div className={styles.filterBlock}>
              <label
                htmlFor="areaInput"
                className={styles.filterLabel}
              >
                {t("rentals.areaLocation")}
              </label>
              <input
                id="areaInput"
                type="text"
                placeholder={t("rentals.areaPlaceholder")}
                defaultValue={area}
                onChange={(e) => onAreaChange(e.target.value)}
                className={styles.filterInput}
              />
            </div>

            {/* Price range filter */}
            <div className={styles.filterBlock}>
              <label className={styles.filterLabel}>
                {t("rentals.monthlyPrice")}
              </label>
              <div className={styles.priceInputs}>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder={t("rentals.minPlaceholder")}
                  value={min}
                  onChange={(e) => {
                    setMin(e.target.value);
                    setPage(1);
                  }}
                  className={styles.priceField}
                />
                <span className={styles.priceSep}>—</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder={t("rentals.maxPlaceholder")}
                  value={max}
                  onChange={(e) => {
                    setMax(e.target.value);
                    setPage(1);
                  }}
                  className={styles.priceField}
                />
              </div>
            </div>

            {/* Type pills (Room / Studio / Flat / House) */}
            <div className={styles.filterBlock}>
              <div className={styles.filterLabel}>{t("rentals.houseType")}</div>
              <div className={styles.typePills}>
                {[
                  ["any", t("rentals.any")],
                  ["room", t("rentals.room")],
                  ["studio", t("rentals.studio")],
                  ["flat", t("rentals.flat")],
                  ["house", t("rentals.house")],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setRoomFilter(val);
                      setPage(1);
                    }}
                    className={
                      roomFilter === val
                        ? `${styles.pill} ${styles.pillActive}`
                        : styles.pill
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ---------- RESULTS COLUMN ---------- */}
        <section className={styles.resultsCol}>
          {/* Sort + count row */}
          <div className={styles.sortRow}>
            <div className={styles.countRow}>{headerCountText}</div>

            <div className={styles.sortBox}>
              <label
                htmlFor="sortSel"
                className={styles.sortLabel}
              >
                {t("common.sort")}
              </label>
              <select
                id="sortSel"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className={styles.sortSelect}
              >
                <option value="newest">{t("rentals.newest")}</option>
                <option value="priceAsc">{t("rentals.priceLowToHigh")}</option>
                <option value="priceDesc">
                  {t("rentals.priceHighToLow")}
                </option>
              </select>
            </div>
          </div>

          {/* Cards grid / loading / empty */}
          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : visible.length ? (
            <>
              <div className={styles.grid}>
                {visible.map((r) => (
                  <RentalCard
                    key={
                      resolveRentalId(r) ||
                      r.id ||
                      r.uuid ||
                      `r-${Math.random()}`
                    }
                    item={r}
                  />
                ))}
              </div>

              {/* Load more */}
              {visible.length < filtered.length && (
                <div className={styles.loadMoreRow}>
                  <button
                    className={`${buttonStyles.btn} ${buttonStyles.ghost}`}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t("common.loadMore")}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <img
                src="/img/illustrations/empty-list.svg"
                alt=""
                className={styles.emptyImg}
              />
              <h3>{t("rentals.noRentalsMatchFilters")}</h3>
              <p>
                {t("rentals.tryAdjustingFilters")}
              </p>
              <Link
                to="/app/rentals/post"
                className={`${buttonStyles.btn} ${buttonStyles.primary}`}
              >
                {t("rentals.postRental")}
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
