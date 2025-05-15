// components/Navbar.js
"use client"; // Add this directive for useState and potentially usePathname

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation'; // Import usePathname for active link styling
import { ConnectButton } from '@rainbow-me/rainbowkit';
// Updated Logo with Tailwind classes for styling
const Logo = () => (
    // Applying gradient matching the hero title to the logo
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
    </svg>
);


export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false); // State for mobile menu
    const pathname = usePathname(); // Get current path for active styling

    const navItems = [
        { href: '/MarketPlace', label: 'Marketplace' },
        { href: '/createNFT', label: 'Create NFT' },
        { href: '/MyNFTs', label: 'My Profile' },
        { href: '/NFTBattle', label: 'NFT Battle' },
        { href: '/Auctions', label: 'Auctions' },
    ];

    return (
        // --- Updated Navbar Styling ---
        <nav className="bg-black backdrop-blur-lg shadow-lg sticky  top-0 z-50 border-b border-gray-700/50">
        {/* --- End Updated Styling --- */}
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8"> {/* Wider container */}
                <div className="flex items-center justify-around h-16">
                    {/* Logo and Site Name */}
                    <div className="flex items-left">
                        <Link href="/" className="flex items-center space-x-2 group" title="Home">
                            <Logo />
                            <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 group-hover:opacity-80 transition-opacity duration-300">
                                NFT Nexus
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center space-x-2"> {/* Reduced space */}
                        {navItems.map((item) => {   
                             const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)); // Basic active check
                             return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out
                                        relative group // For potential future underlines or effects
                                        ${isActive
                                            ? 'bg-white/10 text-white shadow-sm scale-105' // Active state with subtle background, white text, slight scale
                                            : 'text-gray-300 hover:text-white hover:bg-white/5' // Inactive state with brighter hover text and faint bg
                                        }
                                    `}
                                >
                                    {item.label}
                                     {/* Optional: Animated underline for hover/active state */}
                                     <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-indigo-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out ${isActive ? 'scale-x-100' : ''}`}></span>
                                </Link>
                             )
                        })}
                        {/* Optional: Connect Wallet Button - Styled to match */}
                        {/* <button className="ml-6 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 ease-in-out">
                            Connect Wallet
                        </button> */}
                        <div className="ml-6">
                            <ConnectButton />
                        </div>    
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            type="button"
                            // --- Updated Mobile Button Styling ---
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white hover:bg-white/10 transition-colors duration-200"
                            // --- End Updated Styling ---
                            aria-controls="mobile-menu"
                            aria-expanded={isOpen}
                        >
                            <span className="sr-only">Open main menu</span>
                            {/* Icons remain the same */}
                            <svg className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                            <svg className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu, show/hide based on menu state. */}
             {/* --- Updated Mobile Menu Panel Styling --- */}
            <div
                className={`
                    absolute top-full left-0 right-0 md:hidden bg-black/80 backdrop-blur-md shadow-xl border-t border-gray-700/50
                    transition-all duration-300 ease-in-out overflow-hidden
                    ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                `} // Animate height and opacity
                id="mobile-menu"
             >
             {/* --- End Updated Styling --- */}
                <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3"> {/* Added more bottom padding */}
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                // --- Updated Mobile Link Styling ---
                                className={`
                                    block px-4 py-3 rounded-md text-base font-medium transition-all duration-200 ease-in-out
                                    ${isActive
                                        ? 'bg-indigo-600 text-white shadow-sm' // Active state with stronger background
                                        : 'text-gray-300 hover:bg-white/10 hover:text-white' // Inactive state
                                    }
                                `}
                                // --- End Updated Styling ---
                                onClick={() => setIsOpen(false)} // Close menu on click
                            >
                                {item.label}
                            </Link>
                        )
                    })}
                    <div className="ml-6">
                            <ConnectButton />
                        </div>
                </div>
            </div>
        </nav>
    );
}