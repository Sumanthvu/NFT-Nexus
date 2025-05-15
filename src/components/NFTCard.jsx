// src/components/NFTCard.js
"use client";

import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import NFTMarketplace from "../contract_data/NFTMarketplace.json"; // Adjust path
import "./NFTCard.css";

const CONTRACT_ADDRESS = "0x13b8718898f70eF57424295b1b6A1eae3F5a0238";
const CONTRACT_ABI = NFTMarketplace.abi;

const NFT_CATEGORIES = ["Artwork", "Video", "GIF"];

function NFTCard({ initialNftData, onListNFT, isListingThisToken, isProcessingListing }) {
  const [metadata, setMetadata] = useState(null);
  const [metadataError, setMetadataError] = useState('');
  const [isLoadingCardData, setIsLoadingCardData] = useState(true); // Unified loading state for URI and metadata

  const tokenId = initialNftData.tokenId;

  const { data: tokenURI, error: tokenURIError, isLoading: isLoadingTokenURI } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'tokenURI',
    args: [tokenId],
    enabled: !!tokenId, // TokenId must be present
  });

  useEffect(() => {
    // This effect handles fetching metadata once tokenURI is available
    if (isLoadingTokenURI) {
        setIsLoadingCardData(true); // Still loading if URI is loading
        return;
    }

    if (tokenURIError) {
      console.error(`NFTCard (TokenID: ${Number(tokenId)}): Error fetching tokenURI:`, tokenURIError);
      setMetadataError(`Failed to fetch URI: ${tokenURIError.shortMessage || tokenURIError.message}`);
      setIsLoadingCardData(false);
      return;
    }

    if (tokenURI) {
      console.log(`NFTCard (TokenID: ${Number(tokenId)}): Fetched tokenURI: ${tokenURI}`);
      const fetchMetadata = async () => {
        setIsLoadingCardData(true); // Set loading true for metadata fetch
        setMetadataError('');
        let gatewayUrl = tokenURI;

        if (tokenURI.startsWith('ipfs://')) {
          gatewayUrl = `https://gateway.pinata.cloud/ipfs/${tokenURI.split('ipfs://')[1]}`;
        } else if (!tokenURI.startsWith('http://') && !tokenURI.startsWith('https://')) {
          setMetadataError("Invalid metadata URL format.");
          setIsLoadingCardData(false);
          return;
        }

        try {
          const response = await fetch(gatewayUrl, { signal: AbortSignal.timeout(20000) });
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed. Status: ${response.status}. Gateway: ${gatewayUrl.substring(0,30)}...`);
          }
          const fetchedMeta = await response.json();
          if (fetchedMeta.image && fetchedMeta.image.startsWith('ipfs://')) {
            fetchedMeta.image = `https://gateway.pinata.cloud/ipfs/${fetchedMeta.image.split('ipfs://')[1]}`;
          }
          setMetadata(fetchedMeta);
        } catch (err) {
          console.error(`NFTCard (TokenID: ${Number(tokenId)}): Error fetching/parsing metadata:`, err);
          setMetadataError(`Meta Error: ${err.message}`);
        } finally {
          setIsLoadingCardData(false); // Done loading metadata (success or fail)
        }
      };
      fetchMetadata();
    } else if (tokenId) {
        // tokenURI is null/undefined but no error and not loading - might be an issue if tokenId is valid
        // This case should ideally be covered by isLoadingTokenURI or tokenURIError
        console.warn(`NFTCard (TokenID: ${Number(tokenId)}): tokenURI is unexpectedly null/undefined without error.`);
        setMetadataError("Could not retrieve token URI.");
        setIsLoadingCardData(false);
    }
  }, [tokenURI, tokenId, tokenURIError, isLoadingTokenURI]);

  if (isLoadingCardData) {
    return (
      <div className="nft-card skeleton">
        <div className="image-placeholder skeleton-bg"></div>
        <div className="info-placeholder">
          <div className="skeleton-text skeleton-bg"></div>
          <div className="skeleton-text short skeleton-bg"></div>
        </div>
      </div>
    );
  }

  const displayName = metadata?.name || `NFT #${Number(tokenId)}`;
  const displayImage = metadata?.image || "";
  const displayCategory = NFT_CATEGORIES[Number(initialNftData.category)] || "Unknown";

  if (metadataError || !metadata) {
     return (
        <div className="nft-card error-card">
            <div className="image-placeholder">
                <span role="img" aria-label="Error" style={{fontSize: "2em"}}>⚠️</span>
            </div>
            <div className="nft-info">
                <h3>NFT #{Number(tokenId)}</h3>
                <p className="error-text small-text">{metadataError || "Could not load metadata."}</p>
                <p className="small-text">Category: {displayCategory}</p>
            </div>
        </div>
     );
  }

  return (
    <div className="nft-card">
      <div className="image-container">
        {displayImage ? (
          <img
            src={displayImage}
            alt={displayName}
            onError={(e) => {
              e.target.style.display = 'none';
              const placeholder = e.target.parentElement.querySelector('.image-placeholder-content');
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="image-placeholder-content" style={{ display: displayImage ? 'none' : 'flex' }}>
          {displayName.substring(0, 20)}{displayName.length > 20 ? "..." : ""}
        </div>
      </div>
      <div className="nft-info">
        <h3>{displayName}</h3>
        <p className="nft-category">Category: {displayCategory}</p>
        {initialNftData.currentlyListed ? (
          <p className="listed-status">Listed: {formatEther(initialNftData.price)} ETH</p>
        ) : (
          <button
            onClick={() => onListNFT(tokenId)}
            disabled={isProcessingListing || isListingThisToken}
            className="list-button"
          >
            {isListingThisToken && isProcessingListing ? (
              <span className="spinner" />
            ) : (
              'List NFT'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
export default NFTCard;