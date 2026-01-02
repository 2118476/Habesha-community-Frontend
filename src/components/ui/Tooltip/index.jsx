import React, { useEffect, useRef, useState } from "react";
import styles from "./Tooltip.module.scss";

export default function Tooltip({ children, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    const el = ref.current;
    if (!el) return;
    const onEnter = () => setOpen(true);
    const onLeave = () => setOpen(false);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  },[]);
  return (
    <span className={styles.anchor} ref={ref}>
      {children}
      {open && <span role="tooltip" className={styles.tip}>{label}</span>}
    </span>
  );
}
