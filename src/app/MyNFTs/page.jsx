// app/MyNFTs/page.js (or wherever your ProfilePage is)
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion } from 'framer-motion';
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchPendingTransactions // For more responsive UI on tx status
} from 'wagmi';
import { parseEther, formatEther } from 'viem';

import NFTMarketplace from "../../contract_data/NFTMarketplace.json"; // Adjust path
import NFTCard from '../../components/NFTCard'; // Adjust path
import "./MyNFTs.css"; // Your existing styles

const CONTRACT_ADDRESS = "0x13b8718898f70eF57424295b1b6A1eae3F5a0238";
const CONTRACT_ABI = NFTMarketplace.abi;

const shortenAddress = (address) => {
  if (!address) return "Not Connected";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const NFT_CATEGORIES_FILTER_MAP = {
    "all": "All",
    "0": "Artwork", // Corresponds to NFTCategory.Artwork
    "1": "Video",   // Corresponds to NFTCategory.Video
    "2": "GIF"      // Corresponds to NFTCategory.GIF
};

export default function ProfilePage() {
  const [pageError, setPageError] = useState(""); // For general page errors
  const [filter, setFilter] = useState("all"); // "all", "0", "1", "2"
  const [isListingTokenId, setIsListingTokenId] = useState(null); // BigInt: Token ID being listed
  const [currentListingFee, setCurrentListingFee] = useState(null); // Store fetched listing fee

  // Spotlight and Video Refs (no change)
  const videoRef = useRef(null);
  const [spotlightPosition, setSpotlightPosition] = useState({ x: 0, y: 0 });
  const [spotlightOpacity, setSpotlightOpacity] = useState(0);
  const profileHeaderRef = useRef(null);

  // --- Wagmi Hooks ---
  const { address: userAddress, isConnected, isDisconnected } = useAccount();

  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address: userAddress,
    enabled: !!userAddress,
  });

  // Fetch My NFTs (raw data from contract)
  const {
    data: myNftContractData, // Array of ListedToken structs
    isLoading: isLoadingMyNFTs,
    error: errorMyNFTs,
    refetch: refetchMyNFTs,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getMyNFTs', // This is correct based on your contract
    account: userAddress, // Important: getMyNFTs uses msg.sender
    enabled: !!userAddress,
  });

  // Fetch current listing fee (mintingPrice from contract)
  const { data: fetchedListingFee, error: listingFeeError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getmintingPrice',
    enabled: isConnected, // Fetch when connected
  });

  useEffect(() => {
    if (fetchedListingFee) {
      setCurrentListingFee(fetchedListingFee); // Store as BigInt
      console.log("ProfilePage: Fetched listing fee:", formatEther(fetchedListingFee), "ETH");
    }
    if (listingFeeError) {
      console.error("ProfilePage: Error fetching listing fee:", listingFeeError);
      setPageError("Could not fetch listing fee. Listing might fail.");
    }
  }, [fetchedListingFee, listingFeeError]);

  useEffect(() => {
    console.log("ProfilePage Mount/Update: isConnected:", isConnected, "userAddress:", userAddress);
    if (isConnected && userAddress) {
      console.log("ProfilePage: Conditions met, attempting to refetch NFTs.");
      refetchMyNFTs(); // You can try explicitly refetching once conditions are met
    }
  }, [isConnected, userAddress, refetchMyNFTs]); // Add refetchMyNFTs to dependencies
  
  // --- Listing NFT Logic ---
  const {
    data: listTxData,
    writeContract: listNFTWrite,
    isPending: isSubmittingListTx, // Wallet is open, user needs to confirm
    error: listSubmitError
  } = useWriteContract();

  const {
    isLoading: isConfirmingListing,
    isSuccess: isListingSuccess,
    error: listConfirmationError
  } = useWaitForTransactionReceipt({
    hash: listTxData?.hash,
    confirmations: 1,
  });

  const handleListNFT = async (tokenIdToList) => { // tokenIdToList will be BigInt
    if (!currentListingFee) {
      alert("Listing fee not available. Please try again in a moment.");
      console.error("ProfilePage: Listing attempted without currentListingFee.");
      return;
    }

    const priceString = prompt("Enter listing price in ETH:");
    if (priceString === null) return; // User cancelled
    const price = parseFloat(priceString);
    if (isNaN(price) || price <= 0) {
      alert("Invalid price. Please enter a positive number.");
      return;
    }

    setIsListingTokenId(tokenIdToList); // Set the token ID that is currently being processed for listing

    console.log(`ProfilePage: Attempting to list Token ID: ${Number(tokenIdToList)}, Price: ${price} ETH, Fee: ${formatEther(currentListingFee)} ETH`);

    listNFTWrite({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'createListedToken',
      args: [tokenIdToList, parseEther(price.toString())],
      value: currentListingFee, // This is the `mintingPrice` acting as listing fee
    });
  };

  // Effect to handle listing transaction outcomes
  useEffect(() => {
    if (isSubmittingListTx) {
      console.log("ProfilePage: Listing transaction submitted to wallet for approval...");
    }
    if (isListingSuccess) {
      alert("NFT listed successfully!");
      console.log("ProfilePage: NFT Listing successful, tx hash:", listTxData?.hash);
      refetchMyNFTs(); // Refresh the user's NFTs
      setIsListingTokenId(null); // Clear the currently listing token ID
    }
    const submissionError = listSubmitError || listConfirmationError;
    if (submissionError && isListingTokenId) { // only show alert if it was for the token we tried to list
      console.error("ProfilePage: NFT Listing failed:", submissionError);
      alert(`Listing failed: ${submissionError?.shortMessage || submissionError?.message || 'Unknown error'}`);
      setIsListingTokenId(null); // Clear the currently listing token ID
    }
  }, [isSubmittingListTx, isListingSuccess, listSubmitError, listConfirmationError, refetchMyNFTs, listTxData, isListingTokenId]);

  // --- Spotlight Handlers (no change) ---
  const handleMouseMove = (e) => {
    if (!profileHeaderRef.current) return;
    const rect = profileHeaderRef.current.getBoundingClientRect();
    setSpotlightPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const handleMouseEnter = () => setSpotlightOpacity(1);
  const handleMouseLeave = () => setSpotlightOpacity(0);


  // --- Filtered NFTs based on `myNftContractData` (filters on contract data like category) ---
  const nftsToDisplay = useMemo(() => {
    if (!myNftContractData) return [];
    if (filter === "all") return myNftContractData;
    // Ensure `nft.category` is a number (or BigInt that can be converted to number for comparison)
    // Your contract stores category as NFTCategory enum (uint8)
    return myNftContractData.filter(nft => nft && Number(nft.category).toString() === filter);
  }, [myNftContractData, filter]);

  // Overall page loading state
  const pageLoading = isLoadingMyNFTs; // Balance loading is separate, metadata loading is per card

  // Primary error for the page (e.g., can't fetch NFT list)
  let mainPageError = pageError; // General errors
  if (errorMyNFTs) {
    mainPageError = `Error fetching your NFTs: ${errorMyNFTs.shortMessage || errorMyNFTs.message}`;
  }


  // Log disconnect/connect states
  useEffect(() => {
    if (isDisconnected) {
        console.log("ProfilePage: Wallet disconnected.");
        setPageError("Please connect your wallet to view your profile.");
    }
    if (isConnected && userAddress) {
        console.log("ProfilePage: Wallet connected. Address:", userAddress);
        setPageError(""); // Clear "please connect" error
        refetchMyNFTs(); // Refetch on connect or account change
    }
  }, [isConnected, isDisconnected, userAddress, refetchMyNFTs]);


  if (isDisconnected && !mainPageError) { // Show connect message if no other major error
    return (
      <div className="profile-page content" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>My Profile</h1>
        <p>Please connect your wallet to view your NFTs.</p>
        {/* Consider adding a <w3m-button /> or similar if not globally available */}
      </div>
    );
  }

  return (
    <>
      <div className="profile-page">
        <div className="content">
          <header
            ref={profileHeaderRef}
            className="profile-header"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div
              className="spotlight-effect-overlay"
              style={{
                background: `radial-gradient(circle at ${spotlightPosition.x}px ${spotlightPosition.y}px, rgba(0, 255, 255, 0.15) 0%, transparent 70%)`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: spotlightOpacity }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h1>My Profile</h1>
              {isConnected && userAddress && (
                <div className="details">
                  <div>
                    <span>Address:</span>
                    <span className="value-pill address">{shortenAddress(userAddress)}</span>
                  </div>
                  <div>
                    <span>Balance:</span>
                    <span className="value-pill balance">
                      {isBalanceLoading ? "Loading..." : balanceData ? `${parseFloat(formatEther(balanceData.value)).toFixed(4)} ${balanceData.symbol}` : "N/A"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </header>

          {isConnected && userAddress && (
            <section className="nft-section">
              <div className="section-header">
                <h2>My NFT Collection</h2>
                <div className="filters">
                  {Object.entries(NFT_CATEGORIES_FILTER_MAP).map(([key, value]) => (
                     <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={filter === key ? "active" : ""}
                     >
                        {value}
                     </button>
                  ))}
                </div>
              </div>

              {pageLoading && !mainPageError ? (
                <div className="loading-grid">
                  {[...Array(6)].map((_, i) => (
                    <div key={`skeleton-${i}`} className="nft-card skeleton">
                      <div className="image-placeholder skeleton-bg"></div>
                      <div className="info-placeholder">
                        <div className="skeleton-text skeleton-bg"></div>
                        <div className="skeleton-text short skeleton-bg"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : mainPageError ? (
                <div className="error-message">{mainPageError}</div>
              ) : nftsToDisplay.length === 0 ? (
                <div className="empty-message">
                  {filter === 'all' ? "You don't own any NFTs yet, or they are still loading." : `No NFTs found in the '${NFT_CATEGORIES_FILTER_MAP[filter]}' category.`}
                </div>
              ) : (
                <div className="nft-grid">
                  {nftsToDisplay.map(nftContractItem => ( // This is item from getMyNFTs
                    <NFTCard
                      key={nftContractItem.tokenId.toString()}
                      initialNftData={nftContractItem} // Pass the ListedToken struct
                      onListNFT={handleListNFT}
                      // Pass listing state for this specific token
                      isListingThisToken={isListingTokenId === nftContractItem.tokenId}
                      isProcessingListing={isSubmittingListTx || isConfirmingListing}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
           {/* General page error if not related to NFT fetching specifically */}
           {pageError && !mainPageError && (
                <div className="error-message" style={{textAlign: 'center', marginTop: '20px'}}>
                    {pageError}
                </div>
            )}
        </div>
      </div>
    </>
  );
}