// app/MyNFTs/page.js
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion } from 'framer-motion';
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi';
import { parseEther, formatEther } from 'viem';

import NFTMarketplace from "../../contract_data/NFTMarketplace.json"; // Adjust path
import NFTCard from '../../components/NFTCard'; // Adjust path
import "./MyNFTs.css";

const CONTRACT_ADDRESS = "0x13b8718898f70eF57424295b1b6A1eae3F5a0238";
const CONTRACT_ABI = NFTMarketplace.abi;

const shortenAddress = (address) => {
  if (!address) return "Not Connected";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const NFT_CATEGORIES_FILTER_MAP = {
    "all": "All", "0": "Artwork", "1": "Video", "2": "GIF"
};

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false); // For client-side only logic
  const [pageError, setPageError] = useState("");
  const [filter, setFilter] = useState("all");
  const [isListingTokenId, setIsListingTokenId] = useState(null);
  const [currentListingFee, setCurrentListingFee] = useState(null);

  const profileHeaderRef = useRef(null);
  const [spotlightPosition, setSpotlightPosition] = useState({ x: 0, y: 0 });
  const [spotlightOpacity, setSpotlightOpacity] = useState(0);

  // --- Mounted Effect ---
  useEffect(() => {
    setMounted(true);
    console.log("ProfilePage: Component mounted on client.");
  }, []);

  // --- Wagmi Hooks ---
  const { address: userAddress, isConnected, isDisconnected, isConnecting } = useAccount();

  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address: userAddress,
    enabled: mounted && !!userAddress, // Enable only when mounted and address is available
  });

  const {
    data: myNftContractData,
    isLoading: isLoadingMyNFTsInitial, // Initial load from contract
    error: errorMyNFTs,
    refetch: refetchMyNFTs,
    isFetching: isRefetchingMyNFTs, // True when refetch is in progress
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getMyNFTs',
    account: userAddress,
    // Enable only when mounted, connected, and address is available
    enabled: mounted && isConnected && !!userAddress && !isConnecting,
  });

  const { data: fetchedListingFee, error: listingFeeError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getmintingPrice',
    enabled: mounted && isConnected,
  });

  useEffect(() => {
    if (fetchedListingFee) setCurrentListingFee(fetchedListingFee);
    if (listingFeeError) {
      console.error("ProfilePage: Error fetching listing fee:", listingFeeError);
      setPageError("Could not fetch listing fee.");
    }
  }, [fetchedListingFee, listingFeeError]);

  // --- Listing NFT Logic ---
  const {
    data: listTxData,
    writeContract: listNFTWrite,
    isPending: isSubmittingListTx,
    error: listSubmitError
  } = useWriteContract();

  const {
    isLoading: isConfirmingListing,
    isSuccess: isListingSuccess,
    error: listConfirmationError
  } = useWaitForTransactionReceipt({ hash: listTxData?.hash, confirmations: 1 });

  const handleListNFT = async (tokenIdToList) => {
    if (!currentListingFee) {
      alert("Listing fee not available. Please try again."); return;
    }
    const priceString = prompt("Enter listing price in ETH:");
    if (priceString === null) return;
    const price = parseFloat(priceString);
    if (isNaN(price) || price <= 0) {
      alert("Invalid price."); return;
    }
    setIsListingTokenId(tokenIdToList);
    listNFTWrite({
      address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'createListedToken',
      args: [tokenIdToList, parseEther(price.toString())], value: currentListingFee,
    });
  };

  useEffect(() => {
    if (isListingSuccess) {
      alert("NFT listed successfully!"); refetchMyNFTs(); setIsListingTokenId(null);
    }
    const submissionError = listSubmitError || listConfirmationError;
    if (submissionError && isListingTokenId) {
      alert(`Listing failed: ${submissionError?.shortMessage || submissionError?.message}`);
      setIsListingTokenId(null);
    }
  }, [isListingSuccess, listSubmitError, listConfirmationError, refetchMyNFTs, isListingTokenId]);

  // --- Spotlight Handlers ---
  const handleMouseMove = (e) => { /* ... */ }; const handleMouseEnter = () => setSpotlightOpacity(1); const handleMouseLeave = () => setSpotlightOpacity(0);
  // (Spotlight logic remains the same)
  useEffect(() => {
    const currentRef = profileHeaderRef.current;
    if (currentRef) {
        const mouseMove = (e) => {
            if (!profileHeaderRef.current) return;
            const rect = profileHeaderRef.current.getBoundingClientRect();
            setSpotlightPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        };
        currentRef.addEventListener('mousemove', mouseMove);
        currentRef.addEventListener('mouseenter', handleMouseEnter);
        currentRef.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            currentRef.removeEventListener('mousemove', mouseMove);
            currentRef.removeEventListener('mouseenter', handleMouseEnter);
            currentRef.removeEventListener('mouseleave', handleMouseLeave);
        };
    }
  }, []);


  // --- Filtered NFTs ---
  const nftsToDisplay = useMemo(() => {
    if (!myNftContractData) return [];
    if (filter === "all") return myNftContractData;
    return myNftContractData.filter(nft => nft && Number(nft.category).toString() === filter);
  }, [myNftContractData, filter]);

  // --- Overall Page Status ---
  const isLoadingPageData = !mounted || isLoadingMyNFTsInitial || isRefetchingMyNFTs || isConnecting;
  let mainPageError = pageError;
  if (errorMyNFTs) mainPageError = `Error fetching NFTs: ${errorMyNFTs.shortMessage || errorMyNFTs.message}`;

  // Effect for logging and handling connection states
  useEffect(() => {
    console.log(`ProfilePage State: mounted=${mounted}, isConnected=${isConnected}, isConnecting=${isConnecting}, userAddress=${userAddress}, isLoadingMyNFTsInitial=${isLoadingMyNFTsInitial}, isRefetchingMyNFTs=${isRefetchingMyNFTs}`);
    if (mounted) {
        if (isDisconnected && !isConnecting) {
            setPageError("Please connect your wallet to view your profile.");
        } else if (isConnected && userAddress) {
            setPageError(""); // Clear "connect" error
            // refetchMyNFTs(); // Reconsider if refetchMyNFTs is needed here; enabled flag should handle it.
                           // If account changes, useReadContract with 'account' prop will refetch.
        } else if (isConnecting) {
            setPageError(""); // Clear other errors while connecting
        }
    }
  }, [mounted, isConnected, isDisconnected, isConnecting, userAddress, isLoadingMyNFTsInitial, isRefetchingMyNFTs]);


  // --- Render Logic ---
  if (!mounted) { // Show basic loading shell until client is mounted
    return (
      <div className="profile-page content" style={{ textAlign: 'center', padding: '50px' }}>
        <h1>My Profile</h1>
        <p>Loading page...</p>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="profile-page content" style={{ textAlign: 'center', padding: '50px' }}>
        <h1>My Profile</h1>
        <p>Connecting to wallet...</p>
      </div>
    );
  }

  if (isDisconnected && !isConnecting) {
    return (
      <div className="profile-page content" style={{ textAlign: 'center', padding: '50px' }}>
        <h1>My Profile</h1>
        <p>Please connect your wallet to view your NFTs.</p>
        {/* You might want to add a <w3m-button /> here if Web3Modal is used */}
      </div>
    );
  }

  // From this point, we assume `mounted` is true and user is `isConnected` (or was trying to connect)

  return (
    <>
      <div className="profile-page">
        <div className="content">
          <header ref={profileHeaderRef} className="profile-header">
            <motion.div className="spotlight-effect-overlay" style={{ background: `radial-gradient(circle at ${spotlightPosition.x}px ${spotlightPosition.y}px, rgba(0, 255, 255, 0.15) 0%, transparent 70%)` }} initial={{ opacity: 0 }} animate={{ opacity: spotlightOpacity }} transition={{ duration: 0.2, ease: 'easeInOut' }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h1>My Profile</h1>
              {userAddress && (
                <div className="details">
                  <div><span>Address:</span><span className="value-pill address">{shortenAddress(userAddress)}</span></div>
                  <div><span>Balance:</span><span className="value-pill balance">{isBalanceLoading ? "Loading..." : balanceData ? `${parseFloat(formatEther(balanceData.value)).toFixed(4)} ${balanceData.symbol}` : "N/A"}</span></div>
                </div>
              )}
            </div>
          </header>

          {userAddress && ( // Only show NFT section if user is connected and address is available
            <section className="nft-section">
              <div className="section-header">
                <h2>My NFT Collection</h2>
                <div className="filters">
                  {Object.entries(NFT_CATEGORIES_FILTER_MAP).map(([key, value]) => (
                     <button key={key} onClick={() => setFilter(key)} className={filter === key ? "active" : ""}>{value}</button>
                  ))}
                </div>
              </div>

              {isLoadingPageData && !mainPageError && ( // Show skeletons if loading page data and no major error
                <>
                  <p style={{textAlign: 'center', margin: '20px'}}>Loading your NFT collection...</p>
                  <div className="loading-grid">
                    {[...Array(6)].map((_, i) => (
                      <div key={`skeleton-${i}`} className="nft-card skeleton">
                        <div className="image-placeholder skeleton-bg"></div>
                        <div className="info-placeholder"><div className="skeleton-text skeleton-bg"></div><div className="skeleton-text short skeleton-bg"></div></div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!isLoadingPageData && mainPageError && ( // Show error if done loading but there's an error
                <div className="error-message">{mainPageError}</div>
              )}

              {!isLoadingPageData && !mainPageError && nftsToDisplay.length === 0 && ( // Done loading, no error, no NFTs
                <div className="empty-message">
                  {filter === 'all' ? "You don't own any NFTs, or they are still processing." : `No NFTs found in '${NFT_CATEGORIES_FILTER_MAP[filter]}'.`}
                </div>
              )}

              {!isLoadingPageData && !mainPageError && nftsToDisplay.length > 0 && ( // Done loading, no error, NFTs exist
                <div className="nft-grid">
                  {nftsToDisplay.map(nftContractItem => (
                    <NFTCard
                      key={nftContractItem.tokenId.toString()}
                      initialNftData={nftContractItem}
                      onListNFT={handleListNFT}
                      isListingThisToken={isListingTokenId === nftContractItem.tokenId}
                      isProcessingListing={isSubmittingListTx || isConfirmingListing}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Fallback general page error if not covered above */}
          {pageError && !mainPageError && !isLoadingPageData && (
             <div className="error-message" style={{textAlign: 'center', marginTop: '20px'}}>{pageError}</div>
          )}
        </div>
      </div>
    </>
  );
}