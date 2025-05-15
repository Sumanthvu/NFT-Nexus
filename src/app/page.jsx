"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import InfiniteImageScroll from "../components/InfiniteImageScroll";
import Spotlight from "../components/Spotlight"; // Correct import name
import ScrollingFeatureDisplay from "../components/ScrollingFeatureDisplay";
import { motion } from 'framer-motion';
import Image from 'next/image'; // Import Next.js Image component for optimization

// --- Animation Variants for Hero (Assuming these are defined elsewhere or remove if not used) ---
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };
// --- End Animation Variants ---

// --- Data for Scrolling Feature Section (Keep as is) ---
const scrollingSectionsData = [
    // ... your existing data ...
    {
        id: 'about',
        title: 'About NFT Nexus',
        description: 'Welcome to NFT Nexus — where creativity meets the decentralized future. We’re a team of passionate Web3 enthusiasts redefining the NFT experience by crafting an ecosystem for artists, collectors, and creators.',
        image: '/assets/about.png',
        bgColor: '#06021c',
        textColor: '#FFFFFF',
    },
    {
        id: 'minting',
        title: 'Mint with Ease',
        description: 'Users can mint their NFTs directly through our platform and choose to either keep them or list them for sale based on their own terms. Simple, secure, and straightforward.',
        image: '/assets/mint.png',
        bgColor: '#150959',
        textColor: '#FFFFFF',
    },
    {
        id: 'ai-creation',
        title: 'AI-Powered Creation',
        description: 'Harness the power of AI using Gemini’s API to bring your artistic visions to life—no design skills required. Create unique digital art effortlessly.',
        image: '/assets/1.png',
        bgColor: '#1d0b80',
        textColor: '#FFFFFF',
    },
    {
        id: 'swaps',
        title: 'NFT-to-NFT Swaps',
        description: 'Trade NFTs with others directly, securely, and fairly—because sometimes, a swap is worth more than a sale. Connect and exchange assets seamlessly.',
        image: '/assets/NFTtoNFT.png',
        bgColor: '#190a6b',
        textColor: '#FFFFFF', // Changed to White for better contrast on dark blue/purple
      },
       {
        id: 'marketplace',
        title: 'Curated Marketplace',
        description: 'Discover NFTs across curated sections like Latest, Artwork, Videos, GIFs, and more. Find exactly what you\'re looking for in our organized categories.',
        image: '/assets/Gallery.png',
        bgColor: '#150959',
        textColor: '#FFFFFF', // Changed to White
      },
      {
        id: 'battles',
        title: 'NFT Battles',
        description: 'Feeling lucky? Stake ETH, enter your NFT into battle, and let the odds crown the spotlight winner. Add an exciting competitive edge to your collection.',
        image: '/assets/Battle.png',
        bgColor: '#0d0538',
        textColor: '#FFFFFF', // Changed to White
      },
       {
        id: 'auctions',
        title: 'Exciting Auctions',
        description: 'Start a bidding war and let the highest bidder win your masterpiece. Our auction system provides a dynamic way to sell your most valuable NFTs.',
        image: '/assets/Auction.png',
        bgColor: '#0b0430',
        textColor: '#FFFFFF', // Changed to White
      },
       {
        id: 'mission',
        title: 'Our Mission',
        description: 'We believe NFTs should be more than static digital tokens. They should be alive—battling, evolving, and moving through hands with purpose and passion. NFT Nexus makes this dynamic journey possible.',
        image: '/assets/mission.png',
        bgColor: '#06021c',
        textColor: '#FFFFFF', // Ensure this matches intended contrast
      },
        {
        id: 'future',
        title: 'Built for the Future',
        description: 'This isn’t just a project—it’s a movement. We’re combining cutting-edge blockchain tech with intuitive UX to make NFT creation and trading accessible, fun, and community-driven.',
        image: '/assets/future.png',
        bgColor: '#02010a',
        textColor: '#FFFFFF',
      },
];
// --- End Data ---


export default function HomePage() {
    return (
        // Apply default font to the main container if not using global CSS
        // className="flex flex-col min-h-screen font-roboto ... "
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
          {/* <Navbar /> */}

            <main className="flex-grow">
                {/* Hero Section */}
                <Spotlight className="text-center py-28 md:py-36 px-4 sm:px-6 lg:px-8 text-gray-100 rounded-xl mx-2 sm:mx-4 md:mx-8 my-8 shadow-2xl overflow-hidden">
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10">
                        {/* Heading will use Orbitron if set globally or via Tailwind config */}
                        <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 drop-shadow-lg">
                            Welcome to NFT Nexus
                        </motion.h1>
                        {/* Paragraph uses Roboto (default body font) */}
                        <motion.p variants={itemVariants} className="text-lg md:text-xl lg:text-2xl mb-10 max-w-3xl mx-auto text-gray-300 opacity-95 drop-shadow-md">
                            Where creativity meets the decentralized future. Mint, trade, battle, and auction your unique digital assets.
                        </motion.p>
                        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/MarketPlace">
                                <button className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-blue-500/30">
                                    Explore Marketplace
                                </button>
                            </Link>
                            <Link href="/createNFT">
                                <button className="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-gray-200 font-semibold py-3 px-8 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-slate-500/30">
                                    Create Your NFT
                                </button>
                            </Link>
                        </motion.div>
                    </motion.div>
                </Spotlight>

                {/* Scrolling Feature Section */}
                <ScrollingFeatureDisplay sections={scrollingSectionsData} />

                {/* Featured NFTs Section (Infinite Scroll) */}
              

                {/* --- NEW: NFT Battle Arena Feature Section --- */}
                <section className="bg-gray-200 dark:bg-gradient-to-br from-gray-900 via-gray-950 to-indigo-950/60 py-16 lg:py-20">
                    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
                        {/* Image Column */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="relative aspect-video lg:aspect-square rounded-xl overflow-hidden shadow-2xl" // Changed aspect ratio
                         >
                             <Image
                                 src="/assets/battle1.png" // <<< REPLACE WITH YOUR BATTLE ARENA IMAGE
                                 alt="NFT Battle Arena Promotion"
                                 layout="fill" // Use fill layout
                                 objectFit="cover" // Cover the area
                                 className="transition-transform duration-500 hover:scale-105"
                             />
                             {/* Optional: Gradient overlay */}
                             <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                         </motion.div>

                        {/* Text and Button Column */}
                        <motion.div
                             initial={{ opacity: 0, x: 50 }}
                             whileInView={{ opacity: 1, x: 0 }}
                             viewport={{ once: true, amount: 0.3 }}
                             transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                             className="text-center lg:text-left"
                        >
                             {/* Use font-orbitron explicitly if not set globally */}
                            <h3 className="text-3xl lg:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400">
                                Enter the Arena!
                            </h3>
                            {/* Uses font-roboto (default) */}
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                                Ready for a challenge? Pit your prized NFTs against others in the Battle Arena. Stake your claim, compete for glory, and win exciting ETH rewards. Will your NFT emerge victorious?
                            </p>
                            <Link href="/NFTBattle">
                                <button className="inline-block bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-semibold py-3 px-10 rounded-lg shadow-lg hover:shadow-xl hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 transform hover:-translate-y-1 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900">
                                    Join the Battle
                                </button>
                            </Link>
                        </motion.div>
                    </div>
                </section>
                {/* --- End NFT Battle Arena Section --- */}

                <div className="w-full bg-white dark:bg-gray-900 py-16">
                     {/* Heading uses Orbitron */}
                     <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white px-4 sm:px-6 lg:px-8">
                         Featured NFTs
                     </h2>
                     <InfiniteImageScroll />
                </div>

            </main>

            {/* <Footer /> */}
        </div>
    );
}