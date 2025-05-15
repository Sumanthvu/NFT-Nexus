
import Link from 'next/link';
import { FaTwitter, FaDiscord, FaGithub } from 'react-icons/fa';


const SocialIcon = ({ children, href, label }) => (
    <a
        href={href || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-400 transition duration-300 ease-in-out hover:text-blue-400"
        aria-label={label} // Add aria-label for accessibility
    >
        {children}
    </a>
);

// Footer Link Item
const FooterLink = ({ href, children, isExternal = false }) => (
    <li>
        {isExternal ? (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer" // Important for external links
                className="text-sm text-gray-400 transition duration-300 ease-in-out hover:text-white hover:underline"
            >
                {children}
            </a>
        ) : (
            <Link
                href={href}
                className="text-sm text-gray-400 transition duration-300 ease-in-out hover:text-white hover:underline"
            >
                {children}
            </Link>
        )}
    </li>
);

// --- Main Footer Component ---

export default function MegaFooter() {
    const currentYear = new Date().getFullYear();

    return (
        // Increased padding, darker background
        <footer className="bg-slate-950 h-180 text-gray-400 py-20 sm:py-28 lg:py-32">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                {/* Wider grid layout for more content */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4 lg:gap-x-12 xl:gap-x-16 mb-16 sm:mb-20 lg:mb-24">

                    {/* Column 1: Brand & Socials */}
                    <div className="col-span-2 md:col-span-1"> {/* Takes full width on smallest, 1 col on md+ */}
                        <Link href="/" className="flex items-center space-x-2 mb-4">
                            {/* Logo Placeholder - Replace with your actual Logo component if available */}
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                               <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0c-1.11 0-2.08-.402-2.599-1M12 16v-1m0 1v1m0-8.88a2.5 2.5 0 110-5 2.5 2.5 0 010 5zM12 18.75a2.25 2.25 0 002.25-2.25H9.75A2.25 2.25 0 0012 18.75z" />
                             </svg>
                            <span className="font-bold text-xl text-white hover:text-blue-300 transition duration-200">
                                NFT Nexus
                            </span>
                        </Link>
                        <p className="text-sm leading-relaxed mb-6">
                            Redefining the NFT experience. An ecosystem for artists, collectors, and creators.
                        </p>
                        {/* Social Media Icons */}
                         <div className="flex space-x-6">
                           <SocialIcon href="#" label="Twitter">
                             <FaTwitter className="w-5 h-5" /> {/* Slightly smaller icons */}
                           </SocialIcon>
                           <SocialIcon href="#" label="Discord">
                             <FaDiscord className="w-5 h-5" />
                           </SocialIcon>
                           <SocialIcon href="#" label="GitHub"> {/* Add your GitHub link */}
                             <FaGithub className="w-5 h-5" />
                           </SocialIcon>
                           {/* Add icons for Instagram, etc. if needed */}
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h3 className="text-base font-semibold text-white mb-4 tracking-wide">Navigate</h3>
                        <ul className="space-y-3">
                            <FooterLink href="/MarketPlace">Marketplace</FooterLink>
                            <FooterLink href="/createNFT">Create NFT</FooterLink>
                            <FooterLink href="/MyNFTs">My Profile</FooterLink>
                            <FooterLink href="/NFTBattle">NFT Battle</FooterLink>
                            <FooterLink href="/Auctions">Auctions</FooterLink>
                        </ul>
                    </div>

                    {/* Column 3: Learning Resources */}
                    <div>
                        <h3 className="text-base font-semibold text-white mb-4 tracking-wide">Learn</h3>
                        <ul className="space-y-3">
                             <FooterLink href="https://ethereum.org/en/nft/" isExternal={true}>What is an NFT?</FooterLink>
                            <FooterLink href="https://opensea.io/learn/what-is-web3" isExternal={true}>Intro to Web3</FooterLink>
                            <FooterLink href="https://consensys.io/blockchain-explained" isExternal={true}>Blockchain Basics</FooterLink>
                            <FooterLink href="https://ethereum.org/en/developers/docs/apis/json-rpc/" isExternal={true}>Ethereum JSON-RPC</FooterLink>
                            <FooterLink href="https://docs.ethers.org/v5/" isExternal={true}>Ethers.js Docs</FooterLink>
                             {/* Add more quality links */}
                        </ul>
                    </div>

                     {/* Column 4: Legal / Company */}
                    <div>
                        <h3 className="text-base font-semibold text-white mb-4 tracking-wide">Company</h3>
                        <ul className="space-y-3">
                            <FooterLink href="/about-us">About Us</FooterLink> {/* Link to an about page */}
                            <FooterLink href="/contact">Contact</FooterLink> {/* Link to a contact page */}
                            <FooterLink href="/terms">Terms of Service</FooterLink>
                            <FooterLink href="/privacy">Privacy Policy</FooterLink>
                             {/* Maybe add Careers, Blog etc. later */}
                        </ul>
                    </div>

                </div>

                {/* Bottom Bar with Copyright */}
                <div className="mt-16 border-t border-gray-700/40 pt-8 sm:mt-20 lg:mt-24">
                    <p className="text-xs text-gray-500 text-center">© {currentYear} NFT Nexus. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
}