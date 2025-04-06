"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { ethers } from "ethers";
// Remove useInView import if not strictly needed elsewhere, it wasn't used in the main return
// import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion'; // Import motion from framer-motion
import NFTMarketplace from "../../contract_data/NFTMarketplace.json";
import "./MyNFTs.css";
import Navbar from "../../components/Navbar"; // Import Navbar component
const contractAddress = "0x13b8718898f70eF57424295b1b6A1eae3F5a0238";

const shortenAddress = (address) => {
  if (!address) return "Not Connected";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// AnimatedSection is not used in the return block, can be removed if not needed elsewhere
/*
const AnimatedSection = ({ children, title }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '-50px 0px',
  });

  return (
    <section ref={ref} className={`section ${inView ? 'visible' : ''}`}>
      <h2>{title}</h2>
      {children}
    </section>
  );
};
*/

export default function ProfilePage() {
  const [nfts, setNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // Initial filter state
  const [userAddress, setUserAddress] = useState("");
  const [userBalance, setUserBalance] = useState("");
  const [isListing, setIsListing] = useState(null);
  const videoRef = useRef(null);

  // --- Spotlight State and Ref ---
  const [spotlightPosition, setSpotlightPosition] = useState({ x: 0, y: 0 });
  const [spotlightOpacity, setSpotlightOpacity] = useState(0);
  const profileHeaderRef = useRef(null); // Ref for the header element

  // --- Spotlight Event Handlers ---
  const handleMouseMove = (e) => {
    if (!profileHeaderRef.current) return;
    const rect = profileHeaderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSpotlightPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setSpotlightOpacity(1);
  };

  const handleMouseLeave = () => {
    setSpotlightOpacity(0);
  };


  // --- Data Loading ---
  const loadData = async () => {
    setLoading(true);
    setError("");
    setNFTs([]); // Clear previous NFTs
    try {
      if (!window.ethereum) throw new Error("MetaMask is not installed");

      // Use BrowserProvider
      const provider = new ethers.BrowserProvider(window.ethereum);
      // Request accounts first (good practice)
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setUserAddress(address);
      setUserBalance(ethers.formatEther(await provider.getBalance(address)));

      const contract = new ethers.Contract(contractAddress, NFTMarketplace.abi, signer);
      const data = await contract.getMyNFTs();

      const items = await Promise.all(
        data.map(async (nft) => {
          try {
            const tokenIdNum = Number(nft.tokenId); // Use tokenId for category simulation
            const tokenURI = await contract.tokenURI(nft.tokenId);
            let meta = { image: "", name: `NFT #${tokenIdNum}` }; // Default

            if (tokenURI) {
              // Use a more reliable gateway like Pinata
              const gatewayUrl = tokenURI.startsWith('ipfs://')
                ? `https://gateway.pinata.cloud/ipfs/${tokenURI.split('ipfs://')[1]}`
                : tokenURI;
              try {
                // Add timeout for fetch
                const response = await fetch(gatewayUrl, { signal: AbortSignal.timeout(8000) });
                if (response.ok) {
                  const fetchedMeta = await response.json();
                  // Handle IPFS image URLs within metadata
                  if (fetchedMeta.image && fetchedMeta.image.startsWith('ipfs://')) {
                      fetchedMeta.image = `https://gateway.pinata.cloud/ipfs/${fetchedMeta.image.split('ipfs://')[1]}`;
                  }
                  meta = { ...meta, ...fetchedMeta };
                } else {
                  console.warn(`Failed to fetch metadata for ${tokenIdNum}. Status: ${response.status}`);
                }
              } catch (fetchError) {
                 console.warn(`Error fetching metadata for ${tokenIdNum}: ${fetchError.message}`);
              }
            }
            // Simulate category based on Token ID
             const simulatedCategory = (tokenIdNum % 3).toString();

            return {
              tokenId: nft.tokenId,
              image: meta.image || "",
              name: meta.name || `NFT #${tokenIdNum}`,
              price: nft.price,
              currentlyListed: nft.currentlyListed,
              category: simulatedCategory // Add category here
            };
          } catch (err) {
            console.error(`Error loading metadata for NFT ${Number(nft.tokenId)}:`, err);
            return null; // Return null for errors
          }
        })
      );
      // Filter out null items resulting from errors
      setNFTs(items.filter(item => item !== null));

    } catch (err) {
       console.error("Error loading data:", err);
      // Provide more specific error messages
      if (err.message.includes("MetaMask")) {
          setError("MetaMask is not installed or not connected. Please install MetaMask and connect your wallet.");
      } else if (err.code === 4001) { // User rejected connection
          setError("Wallet connection request rejected. Please connect your wallet to view your profile.");
      } else {
           setError(err.message || "An unexpected error occurred while loading data.");
      }
       // Clear sensitive data on error
       setUserAddress("");
       setUserBalance("");
       setNFTs([]);
    } finally {
      setLoading(false);
    }
  };

  // --- List NFT ---
  const listNFT = async (tokenId) => {
    const priceString = prompt("Enter listing price in ETH:");
    if (priceString === null) return; // Handle cancel
    const price = parseFloat(priceString);
    // Add validation for positive price
    if (isNaN(price) || price <= 0) {
      alert("Invalid price. Please enter a positive number.");
      return;
    }

    setIsListing(tokenId);
    try {
       if (!window.ethereum) throw new Error("MetaMask is not installed");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, NFTMarketplace.abi, signer);
      const listingPriceWei = ethers.parseEther(price.toString());
      const listingFeeWei = await contract.getmintingPrice(); // Ensure this function exists and returns the correct fee

      const tx = await contract.createListedToken(
        tokenId,
        listingPriceWei,
        { value: listingFeeWei } // Send the listing fee
      );
      alert("Listing transaction sent! Waiting for confirmation..."); // User feedback
      await tx.wait();
      alert("NFT listed successfully!"); // Success feedback
      loadData(); // Refresh data after listing
    } catch (err) {
      console.error("Listing failed:", err);
      // Provide more specific error message
      alert(`Listing failed: ${err?.reason || err?.message || 'Unknown error'}`);
    } finally {
      setIsListing(null);
    }
  };

  // --- Filter NFTs ---
  const filteredNFTs = useMemo(() => {
     console.log("Current filter:", filter);
     console.log("Available NFTs:", nfts);
     if (filter === "all") return nfts;
     // Ensure nft.category exists before filtering
     const filtered = nfts.filter(nft => nft && nft.category === filter);
     console.log("Filtered NFTs:", filtered);
     return filtered;
  }, [nfts, filter]);


  // --- Load data on mount ---
   useEffect(() => {
     loadData();

     // Add listener for account changes
     const handleAccountsChanged = (accounts) => {
       console.log("Accounts changed:", accounts);
       if (accounts.length === 0) {
         // User disconnected
         setUserAddress("");
         setUserBalance("");
         setNFTs([]);
         setError("Please connect MetaMask.");
         setLoading(false);
       } else {
         // Account switched, reload data
         loadData();
       }
     };

     if (window.ethereum) {
       window.ethereum.on('accountsChanged', handleAccountsChanged);
     }

     // Cleanup listener
     return () => {
       if (window.ethereum?.removeListener) {
         window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
       }
     };
   }, []); // Empty dependency array means this runs once on mount and cleanup on unmount

  return (
    <div className="profile-page">
      <video
        ref={videoRef}
        className="background-video"
        autoPlay
        loop
        muted
        playsInline
        src="/profile-background.mp4" // Ensure this path is correct
      />
      {/* Optional: Add an overlay div for better contrast if needed */}
      {/* <div className="video-overlay"></div> */}

      <div className="content">
        {/* Attach Spotlight Handlers and Ref to the header */}
        <header
            ref={profileHeaderRef}
            className="profile-header"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Spotlight Effect Div */}
            <motion.div
                className="spotlight-effect-overlay" // Add a class if needed for base styles
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none', // Ignore mouse events
                    background: `radial-gradient(circle at ${spotlightPosition.x}px ${spotlightPosition.y}px, rgba(0, 255, 255, 0.15) 0%, transparent 70%)`, // Cyan glow, adjust transparency/spread
                    zIndex: 1, // Below content
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: spotlightOpacity }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
            />

            {/* Header Content (needs to be above the spotlight) */}
            <div style={{ position: 'relative', zIndex: 2 }}>
                <h1>My Profile</h1>
                <div className="details">
                    <div>
                    <span>Address:</span>
                    {/* Add pill background directly */}
                    <span className="value-pill address">{shortenAddress(userAddress)}</span>
                    </div>
                    <div>
                    <span>Balance:</span>
                    {/* Add pill background directly */}
                    <span className="value-pill balance">
                        {userBalance ? `${parseFloat(userBalance).toFixed(4)} ETH` : "Loading..."}
                    </span>
                    </div>
                </div>
            </div>
        </header>

        <section className="nft-section">
          <div className="section-header">
            <h2>My NFT Collection</h2>
            <div className="filters">
              {/* Ensure filter state updates correctly */}
              <button onClick={() => setFilter("all")} className={filter === "all" ? "active" : ""}>All</button>
              <button onClick={() => setFilter("0")} className={filter === "0" ? "active" : ""}>Artwork</button>
              <button onClick={() => setFilter("1")} className={filter === "1" ? "active" : ""}>Video</button>
              <button onClick={() => setFilter("2")} className={filter === "2" ? "active" : ""}>GIF</button>
            </div>
          </div>

          {loading ? (
            <div className="loading-grid">
              {[...Array(6)].map((_, i) => (
                 // Updated Skeleton structure
                <div key={`skeleton-${i}`} className="nft-card skeleton">
                  <div className="image-placeholder skeleton-bg"></div>
                  <div className="info-placeholder">
                    <div className="skeleton-text skeleton-bg"></div>
                    <div className="skeleton-text short skeleton-bg"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : filteredNFTs.length === 0 ? (
            // More specific empty message
            <div className="empty-message">
                {filter === 'all' ? "You don't own any NFTs yet." : `No NFTs found in this category.`}
            </div>
          ) : (
            <div className="nft-grid">
              {filteredNFTs.map(nft => (
                <div key={nft.tokenId.toString()} className="nft-card"> {/* Use tokenId as key */}
                  <div className="image-container">
                    {nft.image ? (
                      <img
                        src={nft.image}
                        alt={nft.name || `NFT #${Number(nft.tokenId)}`} // Better alt text
                        // Improved error handling: Hide img, show placeholder
                        onError={(e) => {
                           // Check if the next sibling exists and is the placeholder
                           const placeholder = e.target.nextElementSibling;
                           if (placeholder && placeholder.classList.contains('image-placeholder')) {
                             e.target.style.display = 'none'; // Hide broken image
                             placeholder.style.display = 'flex'; // Show placeholder
                           } else {
                               // Fallback if structure is different (hide image anyway)
                               e.target.style.display = 'none';
                               // You could optionally create and insert a placeholder here if needed
                           }
                        }}
                      />
                    ) : null}
                    {/* Placeholder always rendered, shown via onError or if no image initially */}
                    <div
                        className="image-placeholder"
                        // Initially hidden if nft.image exists, shown otherwise or on error
                        style={{ display: nft.image ? 'none' : 'flex' }}
                    >
                        {nft.name || `NFT #${Number(nft.tokenId)}`} {/* Show name in placeholder */}
                    </div>
                  </div>
                  <div className="nft-info">
                    <h3>{nft.name || `NFT #${Number(nft.tokenId)}`}</h3>
                    {nft.currentlyListed ? (
                      // Use class for styling listed price
                      <p className="listed-status">Listed: {ethers.formatEther(nft.price)} ETH</p>
                    ) : (
                      <button
                        onClick={() => listNFT(nft.tokenId)}
                        disabled={isListing === nft.tokenId}
                        className="list-button" // Use class for styling
                      >
                        {isListing === nft.tokenId ? (
                            // Add spinner or loading indicator
                            <span className="spinner" /> // Basic spinner example
                        ) : (
                            'List NFT'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}