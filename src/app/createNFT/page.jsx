"use client";
import React, { useEffect, useState } from "react";


// Import the icons you want to use
import { SquarePen, Sparkles } from "lucide-react";
import { Inter, Poppins } from "next/font/google"; // Assuming you used Option 2 for fonts

// --- Font Configuration (Keep this if you added it) ---
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ['400', '500'],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ['600', '700'],
});
// --- End Font Configuration ---


const images = [
  "/assets/ape1.jpeg",
  "/assets/ape2.jpeg",
  "/assets/ape3.jpeg",
];

export default function CreateNFTPage() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);



  const Logo = () => (
    // Applying gradient matching the hero title to the logo
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
    </svg>
    
);
  return (
    // Add font variables to the root if not done in layout.tsx
    // Or rely on layout.tsx as preferred
    <div className={`grid grid-cols-1 md:grid-cols-2 h-screen bg-black text-white font-sans ${inter.variable} ${poppins.variable}`}>
      {/* Left Panel */}
      <div className="flex flex-col justify-center px-10 gap-10">
        <h1 className="text-5xl font-bold flex items-center gap-2 font-heading"> {/* Use heading font */}
         <Logo/>
          Create
        </h1>

        {/* Clickable Div for Manual NFT Creation - WITH ICON */}
        <a href="./createNFT-manually" className="animated-border-box group">
          {/* Spans for border animation */}
          <span className="border-span border-top"></span>
          <span className="border-span border-right"></span>
          <span className="border-span border-bottom"></span>
          <span className="border-span border-left"></span>
           {/* Content Wrapper */}
          <div className="content-wrapper bg-[#1a1a1a] p-6 rounded-xl cursor-pointer w-full">
             {/* Add flex, items-center, gap to H2. Add Icon component */}
            <h2 className="text-2xl font-semibold pb-5 font-heading flex items-center gap-3"> {/* Added flex, items-center, gap-3 */}
              <SquarePen className="w-6 h-6 text-blue-400" /> {/* Icon + size + color */}
              Create NFT Manually
            </h2>
            <p className="text-md text-white font-sans">
              Upload your artwork, add unique details, and customize every aspect of your NFT. Take full control of your creative process and design a one-of-a-kind piece that reflects your vision.
            </p>
          </div>
        </a>

        {/* Clickable Div for AI NFT Creation - WITH ICON */}
        <a href="./createNFT-Ai" className="animated-border-box group">
           {/* Spans for border animation */}
          <span className="border-span border-top"></span>
          <span className="border-span border-right"></span>
          <span className="border-span border-bottom"></span>
          <span className="border-span border-left"></span>
           {/* Content Wrapper */}
          <div className="content-wrapper bg-[#1a1a1a] p-6 rounded-xl cursor-pointer w-full">
             {/* Add flex, items-center, gap to H2. Add Icon component */}
            <h2 className="text-2xl font-semibold pb-5 font-heading flex items-center gap-3"> {/* Added flex, items-center, gap-3 */}
               <Sparkles className="w-6 h-6 text-purple-400" /> {/* Icon + size + color */}
               Create NFT with AI
             </h2>
            <p className="text-md text-white font-sans">
              Let our AI-powered tool generate innovative and visually stunning NFT designs for you. Simply input a few preferences, and watch as advanced algorithms bring your digital masterpiece to life
            </p>
          </div>
        </a>
      </div>

      {/* Right Panel */}
      <div className="relative hidden md:flex items-center justify-center h-screen overflow-hidden bg-[#1a14c6]">
        <img
          src={images[currentImage]}
          alt="Featured NFT"
          className="h-full w-full object-cover object-center transition-opacity duration-500"
        />
      </div>
    </div>
  );
}