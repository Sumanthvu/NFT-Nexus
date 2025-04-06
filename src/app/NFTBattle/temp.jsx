"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import NFTBattleABI from "../../contract_data/NFTBattle.json"; // Adjust path if needed

// Replace with your deployed NFTBattle contract address
const battleContractAddress = "0xa25F50efE055e345da3634a85C3B6949bec5dA3E";

export default function BattlePage() {
  const [battleContract, setBattleContract] = useState(null);
  const [currentAccount, setCurrentAccount] = useState("");
  const [battleId, setBattleId] = useState(0);
  const [tokenId, setTokenId] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [entries, setEntries] = useState([]);
  const [winnerDetails, setWinnerDetails] = useState(null);
  const [winnerMedia, setWinnerMedia] = useState(""); // URL of NFT media
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize provider, signer, and contract
  useEffect(() => {
    async function init() {
      if (window.ethereum) {
        try {
          console.log("Initializing provider...");
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const account = await signer.getAddress();
          console.log("Connected account:", account);
          setCurrentAccount(account);

          const battle = new ethers.Contract(battleContractAddress, NFTBattleABI.abi, signer);
          setBattleContract(battle);
          console.log("Battle contract instantiated:", battleContractAddress);

          // Get current battle ID from the contract
          const bid = await battle.battleId();
          console.log("Fetched battleId:", bid.toString());
          setBattleId(Number(bid));

          // Check if the current account is the owner (organizer)
          const contractOwner = await battle.owner();
          console.log("Contract owner:", contractOwner);
          setIsOwner(contractOwner.toLowerCase() === account.toLowerCase());
        } catch (err) {
          console.error("Initialization error:", err);
        }
      } else {
        console.error("window.ethereum not found");
      }
    }
    init();
  }, []);

  // Function to enter battle: user provides NFT tokenId and stake ETH
  const enterBattle = async () => {
    if (!tokenId || !stakeAmount) {
      alert("Please provide both token ID and stake amount");
      return;
    }
    setLoading(true);
    try {
      console.log(`Entering battle with tokenId ${tokenId} and stake ${stakeAmount} ETH`);
      // Convert stake amount to Wei
      const stakeWei = ethers.parseEther(stakeAmount);
      console.log("Stake in wei:", stakeWei.toString());
      
      const tx = await battleContract.enterBattle(tokenId, { value: stakeWei });
      console.log("Enter battle transaction sent:", tx.hash);
      await tx.wait();
      console.log("Transaction confirmed for entering battle");
      alert("You have entered the battle!");
    } catch (err) {
      console.error("Error entering battle:", err);
      alert("Error entering battle. Check console for details.");
    }
    setLoading(false);
  };

  // Function for the organizer to declare a winner
  const declareWinner = async () => {
    setLoading(true);
    try {
      console.log("Declaring winner for battleId:", battleId);
      const tx = await battleContract.declareWinner();
      console.log("Declare winner transaction sent:", tx.hash);
      await tx.wait();
      console.log("Winner declared successfully");
      alert("Winner declared successfully!");
      // Optionally, update battleId after declaration
      const bid = await battleContract.battleId();
      console.log("New battleId:", bid.toString());
      setBattleId(Number(bid));
      fetchWinner();
    } catch (err) {
      console.error("Error declaring winner:", err);
      alert("Error declaring winner. Check console for details.");
    }
    setLoading(false);
  };

  // Fetch battle entries for the current battle
  const fetchEntries = async () => {
    try {
      console.log("Fetching battle entries for battleId:", battleId);
      const data = await battleContract.getBattleEntries(battleId);
      console.log("Fetched entries:", data);
      setEntries(data);
    } catch (err) {
      console.error("Error fetching battle entries:", err);
      alert("Error fetching battle entries. Check console for details.");
    }
  };

  // Fetch winner details for the previous battle (battleId - 1)
  const fetchWinner = async () => {
    try {
      if (battleId === 0) {
        alert("No battles have been run yet.");
        return;
      }
      console.log("Fetching winner details for battleId:", battleId - 1);
      const details = await battleContract.getWinnerDetails(battleId - 1);
      console.log("Fetched winner details:", details);
      setWinnerDetails(details);
    } catch (err) {
      console.error("Error fetching winner details:", err);
      alert("Error fetching winner details. Check console for details.");
    }
  };

  // useEffect to fetch NFT media for the winner when winnerDetails change
  useEffect(() => {
    async function fetchWinnerMedia() {
      if (winnerDetails && winnerDetails.tokenURI) {
        try {
          let tokenURI = winnerDetails.tokenURI;
          // If the URI starts with ipfs://, convert it to a gateway URL
          if (tokenURI.startsWith("ipfs://")) {
            tokenURI = `https://ipfs.io/ipfs/${tokenURI.split("ipfs://")[1]}`;
          }
          console.log("Fetching metadata from tokenURI:", tokenURI);
          const res = await fetch(tokenURI);
          const metadata = await res.json();
          console.log("Fetched metadata:", metadata);
          // Assume metadata.image contains the media URL
          let mediaUrl = metadata.image || "";
          if (mediaUrl.startsWith("ipfs://")) {
            mediaUrl = `https://ipfs.io/ipfs/${mediaUrl.split("ipfs://")[1]}`;
          }
          setWinnerMedia(mediaUrl);
        } catch (err) {
          console.error("Error fetching winner media:", err);
        }
      }
    }
    fetchWinnerMedia();
  }, [winnerDetails]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>NFT Battle Arena</h1>
      <p><strong>Connected Account:</strong> {currentAccount}</p>
      <p><strong>Current Battle ID:</strong> {battleId}</p>

      <div style={{ marginTop: "20px" }}>
        <h3>Enter Battle</h3>
        <input
          type="number"
          placeholder="NFT Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          style={{ marginRight: "10px", padding: "8px" }}
        />
        <input
          type="number"
          placeholder="Stake ETH Amount"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          style={{ marginRight: "10px", padding: "8px" }}
        />
        <button onClick={enterBattle} disabled={loading} style={{ padding: "8px 16px" }}>
          {loading ? "Processing..." : "Enter Battle"}
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>Battle Entries</h3>
        <button onClick={fetchEntries} style={{ padding: "8px 16px", marginBottom: "10px" }}>
          Fetch Entries
        </button>
        {entries.length > 0 ? (
          <ul>
            {entries.map((entry, idx) => (
              <li key={idx}>
                <strong>Player:</strong> {entry.player} | <strong>Token ID:</strong> {entry.tokenId.toString()} | <strong>Category:</strong> {entry.name}
              </li>
            ))}
          </ul>
        ) : (
          <p>No battle entries yet.</p>
        )}
      </div>

      {isOwner && (
        <div style={{ marginTop: "20px" }}>
          <h3>Organizer Panel</h3>
          <button onClick={declareWinner} disabled={loading} style={{ padding: "8px 16px" }}>
            {loading ? "Processing..." : "Declare Winner"}
          </button>
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <h3>Last Battle Winner Details</h3>
        <button onClick={fetchWinner} style={{ padding: "8px 16px", marginBottom: "10px" }}>
          Fetch Winner Details
        </button>
        {winnerDetails ? (
          <div>
            <p><strong>Winner:</strong> {winnerDetails.winner}</p>
            <p><strong>Token ID:</strong> {winnerDetails.tokenId.toString()}</p>
            <p><strong>Category:</strong> {winnerDetails.category}</p>
            <p><strong>Reward:</strong> {ethers.formatEther(winnerDetails.reward)} ETH</p>
            <div>
              <strong>NFT Media:</strong>
              {winnerMedia ? (
                <div>
                  <img src={winnerMedia} alt="Winner NFT" style={{ maxWidth: "300px", marginTop: "10px" }} />
                </div>
              ) : (
                <span>No media available</span>
              )}
            </div>
          </div>
        ) : (
          <p>No winner details available.</p>
        )}
      </div>
    </div>
  );
}
