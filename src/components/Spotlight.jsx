// components/HeroSpotlight.js
"use client";

import React, { useRef, useState, useEffect } from 'react';

export default function HeroSpotlight({ children, className = "" }) {
  const containerRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: null, y: null });

  const handleMouseMove = (event) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

   const handleMouseLeave = () => {
    // Optional: Reset position or fade out the light when mouse leaves
     setMousePosition({ x: null, y: null });
   };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave); // Add mouseleave listener

      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave); // Clean up listener
      };
    }
  }, []); // Empty dependency array means this effect runs once on mount

  // Calculate gradient properties based on mouse position
  const spotlightSize = 400; // Size of the spotlight effect in pixels
  const spotlightOpacity = 0.3; // Opacity of the spotlight color
  const spotlightColor = 'rgba(129, 140, 248, '; // Indigo-400 equivalent, adjust as needed

  const gradientStyle = mousePosition.x !== null && mousePosition.y !== null
    ? {
        background: `radial-gradient(${spotlightSize}px circle at ${mousePosition.x}px ${mousePosition.y}px, ${spotlightColor}${spotlightOpacity}), transparent 80%)`,
        transition: 'background 0.1s ease-out', // Smooth transition for the light
      }
    : {
      // Optional: Style when mouse is not over the element (e.g., fade out)
      background: `radial-gradient(${spotlightSize}px circle at 50% 50%, ${spotlightColor}0), transparent 80%)`, // Center and fade out
      transition: 'background 0.3s ease-out',
    };


  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-gray-900 ${className}`} // Base styles, including dark background
    >
      {/* Spotlight Effect Layer */}
      <div
        className="pointer-events-none absolute inset-0 z-0" // Position behind content, ignore mouse
        style={gradientStyle}
      />

      {/* Content Layer */}
      <div className="relative z-10"> {/* Ensure content is above the spotlight */}
        {children}
      </div>
    </div>
  );
}