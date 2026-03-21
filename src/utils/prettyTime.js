/**
 * Translatable relative time: "3h", "2d", "1mo" etc.
 * Pass the `t` function from useTranslation() for i18n support.
 * Falls back to English abbreviations if `t` is not provided.
 */
export default function prettyTime(dateish, t) {
  const d = dateish ? new Date(dateish) : null;
  if (!d || isNaN(+d)) return t ? t("time.justNow", "Just now") : "Just now";

  const sec = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (sec < 60) return t ? t("time.justNow", "Just now") : "Just now";

  const mins = Math.floor(sec / 60);
  if (mins < 60) return t ? t("time.minutes", "{{count}}m", { count: mins }) : `${mins}m`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t ? t("time.hours", "{{count}}h", { count: hrs }) : `${hrs}h`;

  const days = Math.floor(hrs / 24);
  if (days < 7) return t ? t("time.days", "{{count}}d", { count: days }) : `${days}d`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return t ? t("time.weeks", "{{count}}w", { count: weeks }) : `${weeks}w`;

  const months = Math.floor(days / 30);
  if (months < 12) return t ? t("time.months", "{{count}}mo", { count: months }) : `${months}mo`;

  const years = Math.floor(days / 365);
  return t ? t("time.years", "{{count}}y", { count: years }) : `${years}y`;
}
