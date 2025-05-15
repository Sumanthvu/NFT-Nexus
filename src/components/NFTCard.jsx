// src/components/NFTCard.js
"use client";

import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import NFTMarketplace from "../contract_data/NFTMarketplace.json"; // Adjust path as needed
import "./NFTCard.css"; // Create this CSS file for NFTCard specific styles if any

const CONTRACT_ADDRESS = "0x13b8718898f70eF57424295b1b6A1eae3F5a0238"; // Your contract address
const CONTRACT_ABI = NFTMarketplace.abi;

const NFT_CATEGORIES = ["Artwork", "Video", "GIF"]; // Matches your contract enum order

function NFTCard({ initialNftData, onListNFT, isListingThisToken, isProcessingListing }) {
  const [metadata, setMetadata] = useState(null);
  const [metadataError, setMetadataError] = useState('');
  const [isLoadingMetadataAndURI, setIsLoadingMetadataAndURI] = useState(true);

  const tokenId = initialNftData.tokenId; // This is a BigInt from wagmi, convert to number if needed for display/logic

  // 1. Fetch tokenURI for this specific tokenId
  const { data: tokenURI, error: tokenURIError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'tokenURI', // From ERC721URIStorage
    args: [tokenId],
    enabled: !!tokenId,
  });

  // 2. Fetch metadata from IPFS once tokenURI is available
  useEffect(() => {
    if (tokenURIError) {
      console.error(`NFTCard (TokenID: ${Number(tokenId)}): Error fetching tokenURI:`, tokenURIError);
      setMetadataError(`Failed to fetch URI: ${tokenURIError.shortMessage || tokenURIError.message}`);
      setIsLoadingMetadataAndURI(false);
      return;
    }

    if (tokenURI) {
      console.log(`NFTCard (TokenID: ${Number(tokenId)}): Fetched tokenURI: ${tokenURI}`);
      const fetchMetadata = async () => {
        setIsLoadingMetadataAndURI(true); // Start loading metadata
        setMetadataError('');
        let gatewayUrl = tokenURI;

        if (tokenURI.startsWith('ipfs://')) {
          gatewayUrl = `https://gateway.pinata.cloud/ipfs/${tokenURI.split('ipfs://')[1]}`;
        } else if (!tokenURI.startsWith('http://') && !tokenURI.startsWith('https://')) {
          console.warn(`NFTCard (TokenID: ${Number(tokenId)}): Invalid tokenURI format: ${tokenURI}`);
          setMetadataError("Invalid metadata URL format.");
          setIsLoadingMetadataAndURI(false);
          return;
        }
        console.log(`NFTCard (TokenID: ${Number(tokenId)}): Attempting to fetch metadata from: ${gatewayUrl}`);

        try {
          const response = await fetch(gatewayUrl, { signal: AbortSignal.timeout(20000) }); // 20s timeout
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`NFTCard (TokenID: ${Number(tokenId)}): Failed to fetch metadata. Status: ${response.status}. URL: ${gatewayUrl}. Response: ${errorText.substring(0, 100)}`);
            throw new Error(`Failed. Status: ${response.status}`);
          }
          const fetchedMeta = await response.json();
          console.log(`NFTCard (TokenID: ${Number(tokenId)}): Fetched metadata JSON:`, fetchedMeta);

          if (fetchedMeta.image && fetchedMeta.image.startsWith('ipfs://')) {
            fetchedMeta.image = `https://gateway.pinata.cloud/ipfs/${fetchedMeta.image.split('ipfs://')[1]}`;
          }
          setMetadata(fetchedMeta);
        } catch (err) {
          console.error(`NFTCard (TokenID: ${Number(tokenId)}): Error fetching/parsing metadata from ${gatewayUrl}:`, err);
          setMetadataError(`Meta Error: ${err.message}`);
        } finally {
          setIsLoadingMetadataAndURI(false);
        }
      };
      fetchMetadata();
    } else if (tokenId && !tokenURIError) {
      // tokenURI might still be loading from useReadContract
      setIsLoadingMetadataAndURI(true);
    }
  }, [tokenURI, tokenId, tokenURIError]);

  if (isLoadingMetadataAndURI) {
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
                <span role="img" aria-label="Error">⚠️</span>
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
              console.warn(`NFTCard (TokenID: ${Number(tokenId)}): Error loading image: ${displayImage}`);
              e.target.style.display = 'none'; // Hide broken image
              const placeholder = e.target.parentElement.querySelector('.image-placeholder-content');
              if (placeholder) placeholder.style.display = 'flex'; // Show text placeholder
            }}
          />
        ) : null}
        {/* Text placeholder, shown if no image or image fails to load */}
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
            onClick={() => onListNFT(tokenId)} // tokenId from initialNftData
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
