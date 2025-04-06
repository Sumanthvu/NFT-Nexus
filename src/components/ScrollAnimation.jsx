'use client'; // Required because it renders a client component

import React from 'react';
import ScrollAnimation from './InfiniteImageScroll'; // Correct import path

export default function HomePage() {
  return (
    <div> {/* Use a main wrapper or fragment */}
      {/* Content Before the Scroll Section */}
      <section style={{ height: '80vh', background: '#333', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1>Page Content Above</h1>
        <p>Scroll down...</p>
      </section>

      {/* === The Infinite Scroll Component === */}
      <InfiniteImageScroll />      {/* =================================== */}

      {/* Content After the Scroll Section */}
      <section style={{ height: '100vh', background: '#444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Page Content Below</h2>
      </section>
    </div>
  );
}