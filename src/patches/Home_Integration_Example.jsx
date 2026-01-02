/* Example snippet only: integrate into your existing Home page */
import React from "react";
import ExploreCategories from "../components/ExploreCategories";

export default function Home() {
  return (
    <main>
      {/* Keep your existing hero header & CTA buttons */}
      {/* <Hero /> */}
      {/* Remove the old mini images strip under hero here */}

      {/* New Explore section */}
      <ExploreCategories />
    </main>
  );
}
