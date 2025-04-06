// components/ScrollingFeatureDisplay.js
"use client";

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image'; // Use Next.js Image for optimization

export default function ScrollingFeatureDisplay({ sections }) {
  // sections should be an array of objects like:
  // { id: 'about', title: 'About Us', description: '...', image: '/path/to/about-image.png', bgColor: '#...' }

  const componentRef = useRef(null); // Ref for the main component container
  const { scrollYProgress } = useScroll({
    target: componentRef, // Track scroll progress within this component
    offset: ["start start", "end end"], // Start when component top hits viewport top, end when bottom hits viewport bottom
  });

  // State to hold the currently active section's data (for image display)
  const [activeSection, setActiveSection] = useState(sections[0]);

  // Map scroll progress (0 to 1) to the index of the section
  const numSections = sections.length;
  // Create scroll points: e.g., for 3 sections -> [0, 0.5, 1]
  // For 4 sections -> [0, 0.333, 0.666, 1]
  const sectionScrollPoints = Array.from({ length: numSections }, (_, i) => i / (numSections -1));

  // Transform scroll progress into the current section index
  const sectionIndex = useTransform(scrollYProgress, sectionScrollPoints, sections.map((_, i) => i), {
      clamp: true // Prevent values outside the 0-index range
  });

   // Transform scroll progress into background color
   const backgroundColor = useTransform(
       scrollYProgress,
       sectionScrollPoints, // Use the same points
       sections.map(section => section.bgColor || '#111827') // Get background colors from data
   );


  // Effect to update the active section based on the derived index
  useEffect(() => {
    // onChange returns an unsubscribe function, which we return for cleanup
    return sectionIndex.onChange((latestIndex) => {
        const roundedIndex = Math.round(latestIndex); // Round to nearest integer index
         // Check bounds before accessing sections array
        if (roundedIndex >= 0 && roundedIndex < sections.length) {
            setActiveSection(sections[roundedIndex]);
        }
    });
  }, [sectionIndex, sections]); // Depend on the motion value and sections data


  return (
    // Main container - needs significant height to allow scrolling 'through' the sections
    // The height determines how much scroll distance corresponds to the full animation
    // Adjust h-[300vh] or h-[400vh] as needed for desired scroll length per section
    <motion.section
      ref={componentRef}
      style={{ backgroundColor }} // Apply dynamic background color
      className="relative h-[300vh] w-full text-white transition-colors duration-500 ease-in-out" // Base text color (adjust if needed)
    >
      {/* Sticky container for layout (image on left, text on right) */}
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        <div className="container mx-auto grid grid-cols-1 items-center gap-8 px-4 md:grid-cols-2 md:gap-16 lg:gap-24">

          {/* Left Side (Image) - Animates between images */}
          <motion.div
            className="relative aspect-square h-auto w-full max-w-md rounded-xl shadow-xl md:max-w-full lg:aspect-[4/3]"
            key={activeSection.id} // Key change triggers animation/rerender
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
             {/* Use Next/Image */}
             <Image
                src={activeSection.image}
                alt={`${activeSection.title} illustration`}
                fill // Makes the image fill the parent div
                style={{ objectFit: 'contain' }} // Or 'cover' based on your image aspect ratios
                className="rounded-lg"
                priority={sections.findIndex(s => s.id === activeSection.id) === 0} // Prioritize loading the first image
             />
          </motion.div>

          {/* Right Side (Text Content) - Stays vertically centered */}
          {/* This div itself doesn't scroll, the main component scroll triggers changes */}
          <div className="flex flex-col justify-center text-left">
            {/* We map the sections here just to render the text, but only the 'active' one */}
            {/* is styled prominently. We use the main scroll progress to drive changes. */}
            {/* This approach avoids needing separate scroll tracking for the text column */}
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                // Animate opacity based on whether it's the active section
                initial={{ opacity: 0 }}
                animate={{ opacity: activeSection.id === section.id ? 1 : 0.3 }} // Active is full opacity, others dim
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                // Use absolute positioning to stack text blocks; only active one is fully opaque
                className={`absolute transition-opacity duration-500 ease-in-out ${
                    activeSection.id === section.id ? 'opacity-1' : 'text-transparent' // Ensure active text is on top
                }`}
                style={{
                    // Adjust text color based on background potentially?
                    // color: activeSection.textColor || 'black', // Example if you add textColor to data
                }}
              >
                <h2 className="mb-3 text-3xl font-bold md:text-4xl lg:text-5xl">
                  {section.title}
                </h2>
                <p className="text-base leading-relaxed md:text-lg lg:text-xl opacity-90">
                  {section.description}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </motion.section>
  );
}