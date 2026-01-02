import React from "react";
import { InlineSpinner } from "../Spinner/Spinner";
import styles from "./LoadingButton.module.scss";

export function LoadingButton({ 
  loading = false,
  disabled = false,
  children,
  className = "",
  spinnerColor = "white",
  ...props 
}) {
  const isDisabled = loading || disabled;
  
  return (
    <button 
      {...props}
      disabled={isDisabled}
      className={`${styles.loadingButton} ${loading ? styles.loading : ''} ${className}`}
      aria-busy={loading ? "true" : "false"}
    >
      <span className={`${styles.content} ${loading ? styles.contentLoading : ''}`}>
        {children}
      </span>
      {loading && (
        <InlineSpinner 
          size="sm" 
          color={spinnerColor}
          className={styles.spinner}
        />
      )}
    </button>
  );
}