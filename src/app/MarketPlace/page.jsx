"use client";

import { useEffect, useState, useMemo } from "react";
import { ethers } from "ethers";
import { useInView } from 'react-intersection-observer'; // Keep for section animations


// Assuming contract ABI is correctly placed relative to this component
import NFTMarketplace from "../../contract_data/NFTMarketplace.json";
import "./MarketPlace.css"; // We will apply the new styles here

const contractAddress = "0x13b8718898f70eF57424295b1b6A1eae3F5a0238"; // Your contract address

// --- Constants and Mappings ---
const NFTCategoryMap = { 0: "Artwork", 1: "Video", 2: "GIF" };
const NFT_CATEGORY_ARTWORK = 0;
const NFT_CATEGORY_VIDEO = 1;
const NFT_CATEGORY_GIF = 2;

// --- Helper Component for Animated Sections ---
const AnimatedSection = ({ children, title }) => {
  const { ref, inView } = useInView({
    triggerOnce: true, // Only trigger animation once
    threshold: 0.1,
    rootMargin: '-50px 0px',
  });

  return (
    <section
      ref={ref}
      className={`nft-section ${inView ? 'is-visible' : ''}`} // CSS class toggled based on view
    >
      {/* Added span for independent title animation */}
      <h2><span className="section-title-inner">{title}</span></h2>
      {children}
    </section>
  );
};


// --- Main Marketplace Component ---
// Removed unused provider/signer props as ethers.BrowserProvider is used internally
export default function Marketplace() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Fetch NFTs from Contract (Function remains the same) ---
  const loadNFTs = async () => {
    setLoading(true);
    console.log("Attempting to load NFTs...");
    try {
      // Use window.ethereum directly as provider might not be passed
      if (!window.ethereum) {
        console.error("No Ethereum provider found. Cannot load NFTs.");
        alert("Please connect an Ethereum wallet (like MetaMask).");
        setLoading(false);
        return;
      }
      const currentProvider = new ethers.BrowserProvider(window.ethereum);

      const contract = new ethers.Contract(contractAddress, NFTMarketplace.abi, currentProvider);
      console.log("Fetching all NFTs...");
      const data = await contract.getAllNFTs();
      console.log(`Raw NFT data fetched: ${data.length} items`);
      const items = await Promise.all(
        data.map(async (nft) => {
          try {
            const categoryValue = Number(nft.category);
            const categoryName = NFTCategoryMap[categoryValue] || "Unknown";
            const tokenId = Number(nft.tokenId);
            let meta = { image: "", name: `NFT #${tokenId}`, description: "" };
            try {
              const tokenURI = await contract.tokenURI(tokenId);
              if (tokenURI && (tokenURI.startsWith('http') || tokenURI.startsWith('ipfs') || tokenURI.startsWith('data:'))) {
                const displayURI = tokenURI.startsWith('ipfs://')
                  ? `https://ipfs.io/ipfs/${tokenURI.split('ipfs://')[1]}`
                  : tokenURI;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
                const metaRes = await fetch(displayURI, { cache: 'force-cache', signal: controller.signal });
                clearTimeout(timeoutId);
                if (!metaRes.ok) { throw new Error(`HTTP error! status: ${metaRes.status}`); }
                meta = await metaRes.json();
                meta.name = meta.name || `NFT #${tokenId}`;
                meta.image = meta.image || "";
                meta.description = meta.description || "";
              } else { console.warn(`Invalid/missing tokenURI for ID ${tokenId}: ${tokenURI}`); }
            } catch (metaErr) { console.error(`Metadata error for ID ${tokenId}:`, metaErr); }
            return { tokenId, categoryValue, categoryName, currentlyListed: nft.currentlyListed, price: nft.price > 0 ? ethers.formatEther(nft.price) : "0", owner: nft.owner, seller: nft.seller, image: meta.image, name: meta.name, description: meta.description };
          } catch (individualErr) { console.error(`Error processing NFT ID ${nft.tokenId}:`, individualErr); return null; }
        })
      );
      const validItems = items.filter((item) => item !== null);
      console.log(`Processed ${validItems.length} valid items.`);
      setNfts(validItems);
    } catch (err) { console.error("Error loading NFTs:", err); }
    finally { setLoading(false); console.log("Finished NFT load attempt."); }
  };

  // --- Buy NFT Function (Function remains the same) ---
  const buyNFT = async (tokenId, priceInEth) => {
     console.log(`Attempting purchase: Token ${tokenId} for ${priceInEth} ETH`);
     try {
       if (!window.ethereum) { alert("Please install MetaMask."); throw new Error("MetaMask not installed."); }
       const browserProvider = new ethers.BrowserProvider(window.ethereum);
       const signer = await browserProvider.getSigner(); // Needs signer to buy
       const contractWithSigner = new ethers.Contract(contractAddress, NFTMarketplace.abi, signer);
       const priceInWei = ethers.parseEther(priceInEth);
       console.log(`Sending tx for ${priceInWei} wei...`);
       const tx = await contractWithSigner.executeSale(tokenId, { value: priceInWei });
       console.log("Tx sent:", tx.hash);
       alert("Purchase sent! Waiting for confirmation...");
       await tx.wait();
       console.log("Tx confirmed!");
       alert("NFT bought successfully!");
       loadNFTs(); // Refresh list after buying
     } catch (error) {
       console.error("Buy NFT error:", error);
       alert(`Buy error: ${error.reason || error.message || "Unknown error."}`);
     }
   };

  // --- Effects ---
  useEffect(() => {
    loadNFTs();
  }, []); // Runs only once on mount

  // --- Memoized Derived State for Categories (Remains the same) ---
  const sortNewestFirst = (a, b) => b.tokenId - a.tokenId;
  const latestNfts = useMemo(() => [...nfts].sort(sortNewestFirst), [nfts]);
  const artworkNfts = useMemo(() => nfts.filter(nft => nft.categoryValue === NFT_CATEGORY_ARTWORK).sort(sortNewestFirst), [nfts]);
  const videoNfts = useMemo(() => nfts.filter(nft => nft.categoryValue === NFT_CATEGORY_VIDEO).sort(sortNewestFirst), [nfts]);
  const gifNfts = useMemo(() => nfts.filter(nft => nft.categoryValue === NFT_CATEGORY_GIF).sort(sortNewestFirst), [nfts]);

  // --- Render Function for NFT Lists (Corrected Card Structure) ---
  const renderNftList = (nftList, categoryTitle) => {
    if (loading && nfts.length === 0) return null;
    if (nftList.length === 0 && !loading) {
      return <p className="no-nfts-found">No {categoryTitle} currently available.</p>;
    }
    return (
      <div className="nft-scroll-container">
        <div className="nft-row">
          {nftList.map((nft) => (
            <div key={`${categoryTitle}-${nft.tokenId}`} className="nft-card">
              {/* Image Section */}
              <div className="nft-image-wrapper">
                {nft.image ? (
                  <> {/* Fragment for image and its placeholder sibling */}
                    <img
                      src={nft.image.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${nft.image.split('ipfs://')[1]}` : nft.image}
                      alt={nft.name || `NFT ${nft.tokenId}`}
                      className="nft-image"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const placeholder = e.currentTarget.nextElementSibling;
                        if (placeholder && placeholder.classList.contains('nft-image-placeholder')) {
                            placeholder.classList.add('show');
                        }
                      }}
                    />
                    <div className="nft-image-placeholder" aria-label="Image failed to load">No Image</div>
                  </>
                ) : (
                  <div className="nft-image-placeholder show">No Image Provided</div>
                )}
              </div> {/* End nft-image-wrapper */}

              {/* Info Section (Simplified) */}
              <div className="nft-card-info">
                <p className="nft-name" title={nft.name}>
                   {nft.name}
                </p>
                <div className="nft-action">
                  {nft.currentlyListed ? (
                    (nft.price && parseFloat(nft.price) > 0) ? (
                      <button className="buy-button" onClick={() => buyNFT(nft.tokenId, nft.price)}>
                        Buy • {nft.price} ETH
                      </button>
                    ) : (
                      <p className="status-text">Price Error</p>
                    )
                  ) : (
                    <p className="status-text">Not Listed</p>
                  )}
                </div>
              </div> {/* End nft-card-info */}
            </div> // End nft-card
          ))}
          {/* Spacer */}
          <div style={{ minWidth: '1px' }}></div>
        </div> {/* End nft-row */}
      </div> // End nft-scroll-container
    );
  };
  // --- ---

  // --- Main Component Render ---
  return (
    // Changed container class to match styles better if needed
    
    <main className="marketplace-page">
          

       <div className="title-wrapper">
           <h1>Explore the NFT Metaverse</h1>
       </div>

      {loading && nfts.length === 0 ? (
        <div className="loading-indicator">
           Fetching NFTs from the blockchain...
        </div>
      ) : (
        <>
          <AnimatedSection title="Latest Additions">
            {renderNftList(latestNfts, "Latest NFTs")}
          </AnimatedSection>
          <AnimatedSection title="Digital Artwork">
            {renderNftList(artworkNfts, "Artwork NFTs")}
          </AnimatedSection>
          <AnimatedSection title="Video Moments">
            {renderNftList(videoNfts, "Video NFTs")}
          </AnimatedSection>
          <AnimatedSection title="Animated GIFs">
            {renderNftList(gifNfts, "GIF NFTs")}
          </AnimatedSection>
        </>
      )}
    </main> 
  );
}