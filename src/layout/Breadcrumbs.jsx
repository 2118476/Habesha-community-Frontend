import React from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Breadcrumbs.module.scss";

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((p, i) => {
    const to = "/" + parts.slice(0, i + 1).join("/");
    const label = p.replaceAll("-", " ");
    const isLast = i === parts.length - 1;
    return { to, label, isLast };
  });
  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
      <ol>
        <li><Link to="/app/home">Home</Link></li>
        {crumbs.map(c => (
          <li key={c.to} aria-current={c.isLast ? "page" : undefined}>
            {c.isLast ? <span>{c.label}</span> : <Link to={c.to}>{c.label}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
