// src/components/PostedDate/PostedDate.jsx
//
// Small, reusable "Posted 2 hours ago" stamp used across listing cards and
// detail pages so the whole app shows post timing consistently.
//
//   <PostedDate date={item.createdAt} />            -> "Posted 2 hours ago"
//   <PostedDate date={item.createdAt} prefix={false} /> -> "2 hours ago"
//   <PostedDate date={item.createdAt} icon />        -> with a little clock
//
// Renders a semantic <time> element with a full-date tooltip for accessibility.

import React from "react";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import { timeAgo, fullDate, toDate } from "../../utils/timeAgo";
import styles from "./PostedDate.module.scss";

export default function PostedDate({
  date,
  prefix = true,
  icon = false,
  className = "",
}) {
  const { t, i18n } = useTranslation();

  const parsed = toDate(date);
  if (!parsed) return null;

  const locale = i18n?.language || "en";
  const relative = timeAgo(parsed, locale);
  if (!relative) return null;

  const label = prefix ? `${t("common.posted")} ${relative}` : relative;

  return (
    <time
      className={`${styles.posted} ${className}`}
      dateTime={parsed.toISOString()}
      title={fullDate(parsed, locale) || undefined}
    >
      {icon && <Clock size={13} className={styles.icon} aria-hidden="true" />}
      {label}
    </time>
  );
}
