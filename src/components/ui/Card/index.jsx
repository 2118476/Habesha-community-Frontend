import React from "react";
import styles from "./Card.module.scss";

export function Card({ as: As = "section", className, children, ...rest }) {
  return <As className={[styles.card, className].filter(Boolean).join(" ")} {...rest}>{children}</As>;
}

export function CardHeader({ title, actions, className }) {
  return (
    <div className={[styles.header, className].filter(Boolean).join(" ")}>
      <h3>{title}</h3>
      <div className={styles.actions}>{actions}</div>
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={[styles.body, className].filter(Boolean).join(" ")}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return <div className={[styles.footer, className].filter(Boolean).join(" ")}>{children}</div>;
}
