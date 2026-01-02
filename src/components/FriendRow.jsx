import React from "react";
import { Link } from "react-router-dom";
import ProfileChip from "./ProfileChip";
import styles from "./FriendRow.module.scss"; // optional; or reuse your list row class

// Normalize whatever the API returns into a user object the chip understands.
const pickUser = (item) =>
  item?.friend || item?.user || item || {};

export default function FriendRow({ item, to, right }) {
  const u = pickUser(item);
  const href =
    to ||
    `/app/users/${u.username || u.id}`;

  return (
    <Link to={href} className={styles?.row || ""}>
      <ProfileChip
        user={u}
        size="md"
        subtitle={u.username ? `@${u.username}` : undefined}
      />
      {right ? <div className={styles?.right}>{right}</div> : null}
    </Link>
  );
}
