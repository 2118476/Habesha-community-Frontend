import React from "react";
import styles from "./Spinner.module.scss";

export function Spinner({ 
  size = "md", 
  color = "brand", 
  className = "",
  ...props 
}) {
  return (
    <div 
      className={`${styles.spinner} ${styles[size]} ${styles[color]} ${className}`}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <div className={styles.circle} />
    </div>
  );
}

export function InlineSpinner({ 
  size = "sm", 
  color = "brand", 
  className = "",
  ...props 
}) {
  return (
    <Spinner 
      size={size} 
      color={color} 
      className={`${styles.inline} ${className}`}
      {...props}
    />
  );
}