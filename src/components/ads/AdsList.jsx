import React, { memo } from "react";
import AdsPostItem from "./AdsPostItem";

/** Create a stable key for heterogeneous ad items */
function keyOf(it, idx) {
  const id =
    it?.id || it?._id || it?.publicId || it?.listingId || it?.uuid || null;
  const type = (it?.type || "ad").toLowerCase();
  return id ? `${type}-${id}` : `${type}-idx-${idx}`;
}

function AdsListBase({ items }) {
  if (!items?.length) {
    return <div style={{ opacity: 0.8 }}>No posts yet.</div>;
  }

  return (
    <section aria-label="Community posts and ads" role="list">
      {items.map((it, idx) => (
        <div role="listitem" key={keyOf(it, idx)}>
          <AdsPostItem item={it} />
        </div>
      ))}
    </section>
  );
}

export default memo(AdsListBase);
