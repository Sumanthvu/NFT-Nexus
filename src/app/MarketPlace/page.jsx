// app/Marketplace/page.js (or your path)
"use client";

import { useEffect, useState, useMemo } from "react";
import { useInView } from 'react-intersection-observer';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBlockNumber, // For triggering refetches on new blocks
} from 'wagmi';
import { parseEther, formatEther } from 'viem';

import NFTMarketplaceContract from "../../contract_data/NFTMarketplace.json"; // Renamed for clarity
import "./MarketPlace.css";

const CONTRACT_ADDRESS = "0x13b8718898f70eF57424295b1b6A1eae3F5a0238";
const CONTRACT_ABI = NFTMarketplaceContract.abi;

const NFTCategoryMap = { 0: "Artwork", 1: "Video", 2: "GIF" };
const NFT_CATEGORY_ARTWORK = 0;
const NFT_CATEGORY_VIDEO = 1;
const NFT_CATEGORY_GIF = 2;

// --- Helper Component for Animated Sections (No change) ---
const AnimatedSection = ({ children, title }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1, rootMargin: '-50px 0px' });
  return (
    <section ref={ref} className={`nft-section ${inView ? 'is-visible' : ''}`}>
      <h2><span className="section-title-inner">{title}</span></h2>
      {children}
    </section>
  );
};

// --- Individual NFT Card Component for Marketplace ---
// It's good practice to componentize the card for cleaner logic
function MarketplaceNFTCard({ nftContractData, onBuyNFT, isBuyingThisToken, isProcessingBuy }) {
  const [metadata, setMetadata] = useState(null);
  const [metadataError, setMetadataError] = useState('');
  const [isLoadingCardDetails, setIsLoadingCardDetails] = useState(true);
  const tokenId = nftContractData.tokenId;

  const { data: tokenURI, error: tokenURIError, isLoading: isLoadingTokenURI } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'tokenURI',
    args: [tokenId],
    enabled: !!tokenId,
  });

  useEffect(() => {
    if (isLoadingTokenURI) {
      setIsLoadingCardDetails(true); return;
    }
    if (tokenURIError) {
      setMetadataError(`URI Error: ${tokenURIError.shortMessage}`);
      setIsLoadingCardDetails(false); return;
    }
    if (tokenURI) {
      const fetchMetadata = async () => {
        setIsLoadingCardDetails(true); setMetadataError('');
        let gatewayUrl = tokenURI.startsWith('ipfs://') ? `https://gateway.pinata.cloud/ipfs/${tokenURI.split('ipfs://')[1]}` : tokenURI;
        if (!gatewayUrl.startsWith('http')) {
          setMetadataError("Invalid meta URL"); setIsLoadingCardDetails(false); return;
        }
        try {
          const response = await fetch(gatewayUrl, { signal: AbortSignal.timeout(15000) });
          if (!response.ok) throw new Error(`Status ${response.status}`);
          let fetchedMeta = await response.json();
          if (fetchedMeta.image && fetchedMeta.image.startsWith('ipfs://')) {
            fetchedMeta.image = `https://gateway.pinata.cloud/ipfs/${fetchedMeta.image.split('ipfs://')[1]}`;
          }
          setMetadata(fetchedMeta);
        } catch (err) { setMetadataError(`Meta: ${err.message.substring(0,20)}`); }
        finally { setIsLoadingCardDetails(false); }
      };
      fetchMetadata();
    } else if (tokenId) {
        setMetadataError("No token URI found."); setIsLoadingCardDetails(false);
    }
  }, [tokenURI, tokenId, tokenURIError, isLoadingTokenURI]);

  if (isLoadingCardDetails) {
    return (
      <div className="nft-card skeleton-card-market">
        <div className="nft-image-wrapper skeleton-bg"></div>
        <div className="nft-card-info"><div className="skeleton-text-market"></div></div>
      </div>
    );
  }

  const displayName = metadata?.name || `NFT #${Number(tokenId)}`;
  const displayImage = metadata?.image;

  if (metadataError && !metadata) {
    return (
        <div className="nft-card error-card-market">
            <div className="nft-image-wrapper error-placeholder">⚠️</div>
            <div className="nft-card-info"><p className="nft-name" title={displayName}>{displayName.substring(0,25)}</p><p className="error-text-market">{metadataError}</p></div>
        </div>
    );
  }

  return (
    <div className="nft-card">
      <div className="nft-image-wrapper">
        {displayImage ? (
          <>
            <img src={displayImage} alt={displayName} className="nft-image" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; const placeholder = e.currentTarget.nextElementSibling; if (placeholder) placeholder.classList.add('show'); }} />
            <div className="nft-image-placeholder" aria-label="Image failed to load">No Image</div>
          </>
        ) : (<div className="nft-image-placeholder show">No Image Provided</div>)}
      </div>
      <div className="nft-card-info">
        <p className="nft-name" title={displayName}>{displayName.substring(0, 25)}{displayName.length > 25 ? "..." : ""}</p>
        <div className="nft-action">
          {nftContractData.currentlyListed && nftContractData.price > 0 ? (
            <button className="buy-button" onClick={() => onBuyNFT(tokenId, nftContractData.price)} disabled={isProcessingBuy || isBuyingThisToken}>
              {(isBuyingThisToken && isProcessingBuy) ? <span className="spinner-small"/> : `Buy • ${formatEther(nftContractData.price)} ETH`}
            </button>
          ) : (<p className="status-text">Not Listed</p>)}
        </div>
      </div>
    </div>
  );
}


// --- Main Marketplace Component (Refactored with Wagmi) ---
export default function Marketplace() {
  const [mounted, setMounted] = useState(false);
  const [activeBuyTokenId, setActiveBuyTokenId] = useState(null); // For buy button loading state

  const { isConnected } = useAccount(); // Check if wallet is connected for buying

  // For auto-refreshing NFT list on new blocks (optional but good UX)
  const { data: blockNumber } = useBlockNumber({ watch: true });

  // Fetch All NFTs from contract
  const {
    data: allNftsContractData, // This is the array of ListedToken structs
    isLoading: isLoadingAllNFTs,
    error: errorAllNFTs,
    refetch: refetchAllNFTs,
    isFetching: isRefetchingAllNFTs,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getAllNFTs',
    enabled: mounted, // Fetch as soon as component is mounted
    // Consider adding blockNumber to args or use it to trigger refetch if needed for freshness
    // args: [blockNumber], // If your contract took blockNumber, or just use useEffect below
  });

  // Refetch NFTs when a new block is mined to get latest listings/sales
  useEffect(() => {
    if (mounted && blockNumber) { // blockNumber will change on new blocks
      console.log("Marketplace: New block detected, refetching all NFTs.", blockNumber);
      refetchAllNFTs();
    }
  }, [blockNumber, mounted, refetchAllNFTs]);


  useEffect(() => {
    setMounted(true);
    console.log("Marketplace: Component mounted.");
  }, []);

  // --- Buy NFT Logic with Wagmi ---
  const {
    data: buyTxData,
    writeContract: executeBuyNFT,
    isPending: isSubmittingBuyTx,
    error: buySubmitError,
  } = useWriteContract();

  const {
    isLoading: isConfirmingBuy,
    isSuccess: isBuySuccess,
    error: buyConfirmationError,
  } = useWaitForTransactionReceipt({
    hash: buyTxData?.hash,
    confirmations: 1,
  });

  const handleBuyNFT = async (tokenIdToBuy, priceInWei) => { // priceInWei is BigInt from contract
    if (!isConnected) {
      alert("Please connect your wallet to buy an NFT.");
      // Optionally trigger wallet connection modal here
      return;
    }
    setActiveBuyTokenId(tokenIdToBuy);
    console.log(`Marketplace: Attempting to buy Token ID: ${Number(tokenIdToBuy)}, Price (Wei): ${priceInWei.toString()}`);
    executeBuyNFT({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'executeSale',
      args: [tokenIdToBuy],
      value: priceInWei, // Price is already in Wei from contract data
    });
  };

  useEffect(() => {
    if (isSubmittingBuyTx) console.log("Marketplace: Buy transaction submitted to wallet...");
    if (isBuySuccess) {
      alert("NFT bought successfully!");
      console.log("Marketplace: Buy successful, tx hash:", buyTxData?.hash);
      refetchAllNFTs(); // Refresh list after successful buy
      setActiveBuyTokenId(null);
    }
    const submissionOrConfirmationError = buySubmitError || buyConfirmationError;
    if (submissionOrConfirmationError && activeBuyTokenId) {
      console.error("Marketplace: Buy NFT error:", submissionOrConfirmationError);
      alert(`Buy error: ${submissionOrConfirmationError?.shortMessage || submissionOrConfirmationError?.message}`);
      setActiveBuyTokenId(null);
    }
  }, [isSubmittingBuyTx, isBuySuccess, buySubmitError, buyConfirmationError, refetchAllNFTs, buyTxData, activeBuyTokenId]);

  // --- Memoized Derived State for Categories ---
  const sortNewestFirst = (a, b) => Number(b.tokenId) - Number(a.tokenId); // Ensure numbers for sort

  const nftsForDisplay = useMemo(() => {
    if (!allNftsContractData) return [];
    return [...allNftsContractData].sort(sortNewestFirst); // Start with all sorted
  }, [allNftsContractData]);

  const artworkNfts = useMemo(() => nftsForDisplay.filter(nft => Number(nft.category) === NFT_CATEGORY_ARTWORK), [nftsForDisplay]);
  const videoNfts = useMemo(() => nftsForDisplay.filter(nft => Number(nft.category) === NFT_CATEGORY_VIDEO), [nftsForDisplay]);
  const gifNfts = useMemo(() => nftsForDisplay.filter(nft => Number(nft.category) === NFT_CATEGORY_GIF), [nftsForDisplay]);

  // --- Render Function for NFT Lists ---
  const renderNftList = (nftList, categoryTitle) => {
    // isLoadingAllNFTs refers to the initial load of the main list
    // Individual cards will show their own skeletons for metadata loading
    if (isLoadingAllNFTs && nftList.length === 0) return null; // Avoid rendering section if main list is loading

    if (nftList.length === 0 && !isLoadingAllNFTs) {
      return <p className="no-nfts-found">No {categoryTitle} currently available.</p>;
    }
    return (
      <div className="nft-scroll-container">
        <div className="nft-row">
          {nftList.map((nft) => ( // nft is an item from allNftsContractData
            <MarketplaceNFTCard
              key={`${categoryTitle}-${nft.tokenId.toString()}`}
              nftContractData={nft}
              onBuyNFT={handleBuyNFT}
              isBuyingThisToken={activeBuyTokenId === nft.tokenId}
              isProcessingBuy={isSubmittingBuyTx || isConfirmingBuy}
            />
          ))}
          <div style={{ minWidth: '1px' }}></div> {/* Spacer */}
        </div>
      </div>
    );
  };

  // --- Main Component Render ---
  if (!mounted) {
    return <main className="marketplace-page"><div className="loading-indicator">Loading Marketplace...</div></main>;
  }

  const pageIsLoading = isLoadingAllNFTs || isRefetchingAllNFTs;

  return (
    <main className="marketplace-page">
      <div className="title-wrapper">
        <h1>Explore the NFT Metaverse</h1>
      </div>

      {pageIsLoading && (!allNftsContractData || allNftsContractData.length === 0) ? (
        <div className="loading-indicator">Fetching NFTs from the blockchain...</div>
      ) : errorAllNFTs ? (
        <div className="error-message-market">Error loading NFTs: {errorAllNFTs.shortMessage || errorAllNFTs.message}</div>
      ) : (
        <>
          <AnimatedSection title="Latest Additions">
            {renderNftList(nftsForDisplay, "Latest NFTs")}
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