"use client";

import Link from "next/link";
 // Ensure this component uses "use client" if it uses hooks
import InfiniteImageScroll from "../components/InfiniteImageScroll"; // Same for this if needed

export default function HomePage() {
  return (
    <div>
      {/* Navigation Section */}
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>Welcome to My NFT DApp</h1>
        <p>Select a page to navigate:</p>
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            marginTop: "20px",
          }}
        >
          <Link href="/MarketPlace">
            <button>Go to Marketplace</button>
          </Link>
          <Link href="/createNFT">
            <button>Create NFT</button>
          </Link>
          <Link href="/MyNFTs">
            <button>My Profile</button>
          </Link>
          <Link href="/NFTBattle">
            <button>NFTBattle</button>
          </Link>
        </div>
      </div>

      {/* Cards Component Section */}
      <section style={{ marginTop: "50px" }}>
        <InfiniteImageScroll />
      </section>

      <p>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sed, minus
        voluptates quas ipsa doloribus maiores aliquam, nemo, quidem corporis
        aut odio voluptate. Tempora ipsam, est sed ea dignissimos dolor.
        Praesentium!
      </p>
    </div>
  );
}
