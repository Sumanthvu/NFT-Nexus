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
  const [mounted, setMounted] = useState(false);
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
    enabled: mounted && !!userAddress,
  });

  const {
    data: myNftContractData,
    isLoading: isLoadingMyNFTsInitial,
    error: errorMyNFTs,
    refetch: refetchMyNFTs, // Key function for explicit refetch
    isFetching: isRefetchingMyNFTs,
    status: myNftDataStatus, // 'idle', 'pending', 'success', 'error'
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getMyNFTs',
    account: userAddress,
    enabled: mounted && isConnected && !!userAddress && !isConnecting,
  });

  // --- <<< MODIFIED useEffect FOR EXPLICIT REFETCHING >>> ---
  useEffect(() => {
    console.log(
      `ProfilePage Effect (refetch check): mounted=${mounted}, isConnected=${isConnected}, userAddress=${userAddress}, isConnecting=${isConnecting}, myNftDataStatus=${myNftDataStatus}`
    );
    if (mounted && isConnected && !!userAddress && !isConnecting) {
      // Always attempt to refetch if conditions are met, especially if userAddress just became available
      // or if navigating to the page. This ensures fresh data for the current user.
      console.log("ProfilePage: Conditions met for fetching. Calling refetchMyNFTs(). Current data length:", myNftContractData?.length);
      refetchMyNFTs()
        .then(result => {
          console.log("ProfilePage: refetchMyNFTs successful. New data length:", result?.data?.length);
        })
        .catch(err => {
          console.error("ProfilePage: refetchMyNFTs failed:", err);
        });
    } else if (isDisconnected || !userAddress) {
        console.log("ProfilePage: Conditions NOT met for fetching (disconnected or no address).");
    }
    // Key dependencies: mounted, isConnected, userAddress, isConnecting.
    // refetchMyNFTs is stable and doesn't need to be a dependency for triggering the refetch itself,
    // but it's good practice to include functions called within an effect if they aren't guaranteed stable.
    // However, for triggering based on user state changes, userAddress is critical.
  }, [mounted, isConnected, userAddress, isConnecting, refetchMyNFTs]); // Added refetchMyNFTs to satisfy eslint, it's stable.


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
      alert("NFT listed successfully!");
      console.log("ProfilePage: NFT Listing successful, tx hash:", listTxData?.hash);
      refetchMyNFTs(); // Refetch after successful listing
      setIsListingTokenId(null);
    }
    const submissionError = listSubmitError || listConfirmationError;
    if (submissionError && isListingTokenId) {
      console.error("ProfilePage: NFT Listing failed:", submissionError);
      alert(`Listing failed: ${submissionError?.shortMessage || submissionError?.message || 'Unknown error'}`);
      setIsListingTokenId(null);
    }
  }, [isListingSuccess, listSubmitError, listConfirmationError, refetchMyNFTs, listTxData, isListingTokenId]);


  // --- Spotlight Handlers ---
  useEffect(() => {
    const currentRef = profileHeaderRef.current;
    const mouseMoveHandler = (e) => {
        if (!profileHeaderRef.current) return;
        const rect = profileHeaderRef.current.getBoundingClientRect();
        setSpotlightPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    const mouseEnterHandler = () => setSpotlightOpacity(1);
    const mouseLeaveHandler = () => setSpotlightOpacity(0);

    if (currentRef) {
        currentRef.addEventListener('mousemove', mouseMoveHandler);
        currentRef.addEventListener('mouseenter', mouseEnterHandler);
        currentRef.addEventListener('mouseleave', mouseLeaveHandler);
        return () => {
            currentRef.removeEventListener('mousemove', mouseMoveHandler);
            currentRef.removeEventListener('mouseenter', mouseEnterHandler);
            currentRef.removeEventListener('mouseleave', mouseLeaveHandler);
        };
    }
  }, []); // Runs once after profileHeaderRef is set

  // --- Filtered NFTs ---
  const nftsToDisplay = useMemo(() => {
    if (!myNftContractData) return [];
    if (filter === "all") return myNftContractData;
    return myNftContractData.filter(nft => nft && Number(nft.category).toString() === filter);
  }, [myNftContractData, filter]);

  // --- Overall Page Status ---
  // isLoadingMyNFTsInitial is true only on the very first fetch or after cache invalidation.
  // isRefetchingMyNFTs is true when a refetch is in progress (explicit or automatic).
  const isLoadingPageData = !mounted || isLoadingMyNFTsInitial || isRefetchingMyNFTs || isConnecting;
  let mainPageError = pageError;
  if (errorMyNFTs) mainPageError = `Error fetching NFTs: ${errorMyNFTs.shortMessage || errorMyNFTs.message}`;

  // Effect for logging main page state and handling general connection messages
  useEffect(() => {
    // This log helps see the state when other effects might be running or conditions change.
    console.log(
      `ProfilePage State Log: mounted=${mounted}, isConnected=${isConnected}, isConnecting=${isConnecting}, userAddress=${userAddress}, isLoadingMyNFTsInitial=${isLoadingMyNFTsInitial}, isRefetchingMyNFTs=${isRefetchingMyNFTs}, myNftDataStatus=${myNftDataStatus}, myNftContractData length=${myNftContractData?.length}`
    );
    if (mounted) {
        if (isDisconnected && !isConnecting) {
            setPageError("Please connect your wallet to view your profile.");
        } else if (isConnected && userAddress && !errorMyNFTs) { // Only clear if no NFT fetch error
            setPageError("");
        } else if (isConnecting) {
            setPageError("");
        }
    }
  }, [mounted, isConnected, isDisconnected, isConnecting, userAddress, isLoadingMyNFTsInitial, isRefetchingMyNFTs, myNftDataStatus, errorMyNFTs, myNftContractData]);


  // --- Render Logic ---
  if (!mounted) {
    return (
      <div className="profile-page content" style={{ textAlign: 'center', padding: '50px' }}>
        <h1>My Profile</h1> <p>Loading page...</p>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="profile-page content" style={{ textAlign: 'center', padding: '50px' }}>
        <h1>My Profile</h1> <p>Connecting to wallet...</p>
      </div>
    );
  }

  if (isDisconnected && !isConnecting) {
    return (
      <div className="profile-page content" style={{ textAlign: 'center', padding: '50px' }}>
        <h1>My Profile</h1> <p>Please connect your wallet to view your NFTs.</p>
      </div>
    );
  }

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

          {userAddress && (
            <section className="nft-section">
              <div className="section-header">
                <h2>My NFT Collection</h2>
                <div className="filters">
                  {Object.entries(NFT_CATEGORIES_FILTER_MAP).map(([key, value]) => (
                     <button key={key} onClick={() => setFilter(key)} className={filter === key ? "active" : ""}>{value}</button>
                  ))}
                </div>
              </div>

              {isLoadingPageData && !mainPageError && (
                <>
                  <p style={{textAlign: 'center', margin: '20px'}}>Loading your NFT collection...</p>
                  <div className="loading-grid">
                    {[...Array(myNftContractData?.length || 6)].map((_, i) => ( // Show skeletons based on previous data or default
                      <div key={`skeleton-${i}`} className="nft-card skeleton">
                        <div className="image-placeholder skeleton-bg"></div>
                        <div className="info-placeholder"><div className="skeleton-text skeleton-bg"></div><div className="skeleton-text short skeleton-bg"></div></div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!isLoadingPageData && mainPageError && (
                <div className="error-message">{mainPageError}</div>
              )}

              {!isLoadingPageData && !mainPageError && nftsToDisplay.length === 0 && (
                <div className="empty-message">
                  {myNftDataStatus === 'success' /* Check if fetch was successful but returned 0 items */
                    ? (filter === 'all' ? "You don't own any NFTs." : `No NFTs found in '${NFT_CATEGORIES_FILTER_MAP[filter]}'.`)
                    : "Could not load NFTs or your collection is empty."}
                </div>
              )}

              {!isLoadingPageData && !mainPageError && nftsToDisplay.length > 0 && (
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

          {pageError && !mainPageError && !isLoadingPageData && (
             <div className="error-message" style={{textAlign: 'center', marginTop: '20px'}}>{pageError}</div>
          )}
        </div>
      </div>
    </>
  );
}