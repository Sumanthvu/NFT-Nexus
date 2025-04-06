"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import NFTMarketplace from "../../contract_data/NFTMarketplace.json";
import "./MarketPlace.css"; 

const contractAddress = "0x13b8718898f70eF57424295b1b6A1eae3F5a0238";  //deployed by the owner of website

export default function Marketplace({ provider, signer }) {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Existing loadNFTs function (unchanged)
  const loadNFTs = async () => {    
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const browserSigner = await browserProvider.getSigner();
      const contract = new ethers.Contract(contractAddress, NFTMarketplace.abi, browserSigner);

      const data = await contract.getAllNFTs();

      const items = await Promise.all(
        data.map(async (nft) => {
          try {
            const tokenURI = await contract.tokenURI(nft.tokenId);
            const metaRes = await fetch(tokenURI);
            const meta = await metaRes.json();

            return {
              tokenId: Number(nft.tokenId),
              category: Object.keys(nft.category)[0] || nft.category,
              currentlyListed: nft.currentlyListed,
              price: ethers.formatEther(nft.price),
              owner: nft.owner,
              image: meta.image || "",
              name: meta.name || "",
              description: meta.description || ""
            };
          } catch (err) {
            console.error(`Metadata error for token ${nft.tokenId}:`, err);
            return null;
          }
        })
      );

      setNfts(items.filter((i) => i !== null));
      setLoading(false);
    } catch (err) {
      console.error("Error loading NFTs:", err);
      setLoading(false);
    }
  };

  // New function for buying a listed NFT via executeSale
  const buyNFT = async (tokenId, priceInEth) => {
    try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const browserSigner = await browserProvider.getSigner();
      const contractWithSigner = new ethers.Contract(contractAddress, NFTMarketplace.abi, browserSigner);
      const priceInWei = ethers.parseEther(priceInEth);
      console.log(`Buying token ${tokenId} for ${priceInEth} ETH`);
      
      const tx = await contractWithSigner.executeSale(tokenId, { value: priceInWei });
      console.log("Buy transaction sent:", tx.hash);
      await tx.wait();
      alert("NFT bought successfully!");
      loadNFTs();
    } catch (error) {
      console.error("Error buying NFT:", error);
      alert("Error buying NFT. Check console for details.");
    }
  };

  useEffect(() => {
    loadNFTs();
  }, []);

  return (
    <div className="marketplace-container">
      <h1>NFT Marketplace</h1>
      {loading ? (
        <p>Loading NFTs...</p>
      ) : (
        <div className="nft-grid">
          {nfts.map((nft) => (
            <div key={nft.tokenId} className="nft-card">
              {nft.image && (
                <img
                  src={nft.image}
                  alt={`NFT ${nft.tokenId}`}
                  className="nft-image"
                />
              )}
              <p><strong>Name:</strong> {nft.name}</p>
              <p><strong>ID:</strong> {nft.tokenId}</p>
              <p><strong>Category:</strong> {nft.category}</p>
              <p>
                <strong>Owner:</strong>{" "}
                {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {nft.currentlyListed
                  ? `Listed at ${nft.price} ETH`
                  : "Not Listed"}
              </p>
              {nft.currentlyListed ? (
                <button onClick={() => buyNFT(nft.tokenId, nft.price)}>
                  Buy NFT
                </button>
              ) : (
                <p>NFT is not listed; you cannot buy.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
