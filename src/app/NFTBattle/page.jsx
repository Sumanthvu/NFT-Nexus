"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import NFTBattleABI from "../../contract_data/NFTBattle.json"; // Adjust path if needed

// Replace with your deployed NFTBattle contract address
const battleContractAddress = "0xa25F50efE055e345da3634a85C3B6949bec5dA3E";

// Helper function to shorten addresses
const shortenAddress = (address) => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

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
  const [loading, setLoading] = useState(false); // General loading for primary actions
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [winnerLoading, setWinnerLoading] = useState(false);

  // --- (Initialization and Contract Interaction Functions - Keep them the same as before) ---
   useEffect(() => {
    async function init() {
      if (window.ethereum) {
        try {
          console.log("Initializing provider...");
          const provider = new ethers.BrowserProvider(window.ethereum);
          // Request connection if not already connected
          const accounts = await provider.send("eth_requestAccounts", []);
          if (accounts.length === 0) {
              console.log("Please connect to MetaMask.");
              alert("Please connect your wallet to use the Battle Arena.");
              return;
          }

          const signer = await provider.getSigner();
          const account = await signer.getAddress();
          console.log("Connected account:", account);
          setCurrentAccount(account);

          const battle = new ethers.Contract(battleContractAddress, NFTBattleABI.abi, signer);
          setBattleContract(battle);
          console.log("Battle contract instantiated:", battleContractAddress);

          const bid = await battle.battleId();
          const currentBattleId = Number(bid);
          console.log("Fetched battleId:", currentBattleId);
          setBattleId(currentBattleId);

          const contractOwner = await battle.owner();
          console.log("Contract owner:", contractOwner);
          const ownerStatus = contractOwner.toLowerCase() === account.toLowerCase();
          setIsOwner(ownerStatus);
          console.log("Is Owner:", ownerStatus);


          // Fetch initial winner details for the previous battle
          if (currentBattleId > 0) {
             fetchWinner(currentBattleId); // Fetch winner for battleId - 1
          }

        } catch (err) {
          console.error("Initialization error:", err);
          if (err.code === 4001) { // User rejected request
             alert("Wallet connection rejected. Please connect your wallet to proceed.");
          } else {
             alert("Error initializing. Please check the console and ensure you are on the correct network.");
          }
        }
      } else {
        console.error("window.ethereum not found");
        alert("Please install MetaMask or another Ethereum wallet.");
      }
    }
    init();

    // Listen for account changes
    const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
            console.log("Account changed:", accounts[0]);
            setCurrentAccount(accounts[0]);
            // Re-initialize to get correct owner status etc.
             init();
        } else {
            console.log("Wallet disconnected");
            setCurrentAccount("");
            setBattleContract(null);
             setIsOwner(false);
             setEntries([]);
             setWinnerDetails(null);
             setWinnerMedia('');
              alert("Wallet disconnected. Please reconnect.");
        }
    };

    if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    // Cleanup listener on component unmount
    return () => {
        if (window.ethereum && window.ethereum.removeListener) {
             window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
    };

  }, []); // Empty dependency array ensures this runs once on mount

  // Function to enter battle
  const enterBattle = async () => {
    if (!tokenId || !stakeAmount || parseFloat(stakeAmount) <= 0) {
      alert("Please provide a valid NFT Token ID and a positive Stake Amount.");
      return;
    }
    if (!battleContract) {
        alert("Contract not initialized. Please connect your wallet.");
        return;
    }
    setLoading(true);
    try {
      console.log(`Entering battle with tokenId ${tokenId} and stake ${stakeAmount} ETH`);
      const stakeWei = ethers.parseEther(stakeAmount);
      console.log("Stake in wei:", stakeWei.toString());

      // Estimate gas *before* sending transaction for better UX (optional but good)
      // try {
      //     const estimatedGas = await battleContract.enterBattle.estimateGas(tokenId, { value: stakeWei });
      //     console.log("Estimated gas:", estimatedGas.toString());
      // } catch (gasError) {
      //      console.error("Gas estimation failed:", gasError);
      //      alert("Transaction likely to fail. Check NFT ownership, approval, or stake amount. See console.");
      //      setLoading(false);
      //      return;
      // }


      const tx = await battleContract.enterBattle(tokenId, { value: stakeWei });
      console.log("Enter battle transaction sent:", tx.hash);
      const receipt = await tx.wait(); // Wait for confirmation
      console.log("Transaction confirmed for entering battle:", receipt);
      alert("You have successfully entered the battle!");
      setTokenId(""); // Clear inputs after success
      setStakeAmount("");
      fetchEntries(); // Refresh entries after entering
    } catch (err) {
      console.error("Error entering battle:", err);
      // Try to parse revert reason if available
      const reason = err.reason || (err.data ? ethers.toUtf8String("0x" + err.data.toString().substring(138)) : null) || err.message;
      alert(`Error entering battle: ${reason || 'Unknown error. Check console.'}`);
    }
    setLoading(false);
  };

  // Function for the organizer to declare a winner
  const declareWinner = async () => {
     if (!battleContract) {
        alert("Contract not initialized. Please connect your wallet.");
        return;
    }
    setLoading(true);
    try {
      console.log("Declaring winner for battleId:", battleId);

       // Estimate gas (optional)
      // try {
      //     const estimatedGas = await battleContract.declareWinner.estimateGas();
      //     console.log("Estimated gas for declareWinner:", estimatedGas.toString());
      // } catch (gasError) {
      //     console.error("Gas estimation failed for declareWinner:", gasError);
      //     alert("Declare winner transaction likely to fail. Check conditions (e.g., enough entries?). See console.");
      //     setLoading(false);
      //     return;
      // }

      const tx = await battleContract.declareWinner();
      console.log("Declare winner transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Winner declared successfully:", receipt);
      alert("Winner declared successfully!");

      const previousBattleId = battleId; // Store the ID of the battle just ended
      const newBid = await battleContract.battleId();
      const newBattleId = Number(newBid);
      console.log("New battleId:", newBattleId);

      setBattleId(newBattleId);
      setEntries([]); // Clear entries for the new battle
      fetchWinner(previousBattleId + 1); // Fetch the winner details for the battle that just ended (using battleId + 1 because we want details of battleId)

    } catch (err) {
      console.error("Error declaring winner:", err);
      const reason = err.reason || (err.data ? ethers.toUtf8String("0x" + err.data.toString().substring(138)) : null) || err.message;
      alert(`Error declaring winner: ${reason || 'Are there enough entries? Check console.'}`);
    }
    setLoading(false);
  };

  // Fetch battle entries for the current battle
  const fetchEntries = async () => {
    if (!battleContract) {
        // No alert here, might be called automatically
        console.warn("Fetch Entries: Contract not initialized.");
        return;
    }
    setEntriesLoading(true);
    setEntries([]); // Clear previous entries immediately for better UX
    try {
      console.log("Fetching battle entries for battleId:", battleId);
      const data = await battleContract.getBattleEntries(battleId);
      console.log("Fetched entries:", data);
      // Map data to include formatted values if needed
      const formattedEntries = data.map(entry => ({
          player: entry.player,
          tokenId: entry.tokenId.toString(),
          name: entry.name // Assuming 'name' is the category from your ABI struct
      }));
      setEntries(formattedEntries);
    } catch (err) {
      console.error("Error fetching battle entries:", err);
      // Don't alert here as it might be called automatically
      // alert("Error fetching battle entries. Check console for details.");
       setEntries([]); // Ensure entries are cleared on error
    }
    setEntriesLoading(false);
  };

   // Fetch winner details for the SPECIFIED battle ID (battle number)
   const fetchWinner = async (battleNumberToFetch) => {
     if (!battleContract) {
        console.warn("Fetch Winner: Contract not initialized.");
        return;
    }
    const battleIndexToFetch = battleNumberToFetch - 1; // Contract uses 0-based index
     if (battleIndexToFetch < 0) {
        console.log("No previous battles to fetch winner details for.");
        setWinnerDetails(null);
        setWinnerMedia("");
        return;
      }

    setWinnerLoading(true);
    setWinnerDetails(null); // Clear previous winner details while loading
    setWinnerMedia("");
    try {
      console.log("Fetching winner details for battle index:", battleIndexToFetch);
      const details = await battleContract.getWinnerDetails(battleIndexToFetch);
      console.log("Fetched winner details:", details);
       if (details && details.winner !== ethers.ZeroAddress) { // Check if a winner was actually set
            setWinnerDetails({
                battleIndex: battleIndexToFetch, // Store index for display
                winner: details.winner,
                tokenId: details.tokenId.toString(),
                category: details.category, // Assuming 'category' is the field name
                reward: details.reward, // Keep as BigInt for formatting
                tokenURI: details.tokenURI
            });
        } else {
            console.log("No winner found for battle index:", battleIndexToFetch);
            setWinnerDetails(null); // Explicitly set to null if no winner
        }
    } catch (err) {
      console.error("Error fetching winner details:", err);
      // Don't alert here
      // alert("Error fetching winner details. Check console for details.");
      setWinnerDetails(null);
    }
     setWinnerLoading(false);
  };

  // useEffect to fetch NFT media for the winner when winnerDetails change
  useEffect(() => {
    async function fetchWinnerMedia() {
        if (winnerDetails && winnerDetails.tokenURI) {
            setWinnerMedia("loading"); // Indicate loading state for media
            let controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            try {
                let tokenURI = winnerDetails.tokenURI;
                // Handle IPFS URIs robustly
                if (tokenURI.startsWith("ipfs://")) {
                    const cid = tokenURI.split("ipfs://")[1];
                    // Try multiple gateways or use a preferred one
                    tokenURI = `https://gateway.pinata.cloud/ipfs/${cid}`; // Preferred
                    // tokenURI = `https://ipfs.io/ipfs/${cid}`; // Fallback
                } else if (!tokenURI.startsWith("http")) {
                    console.warn("Token URI might be invalid or non-standard:", tokenURI);
                    // Handle other potential URI schemes or relative paths if necessary
                    // Maybe attempt to prepend a base URI if applicable
                     setWinnerMedia("error");
                     clearTimeout(timeoutId);
                     return;
                 }

                console.log("Fetching metadata from tokenURI:", tokenURI);
                const response = await fetch(tokenURI, { signal: controller.signal });
                 clearTimeout(timeoutId); // Clear timeout if fetch completes/fails before timeout

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} fetching metadata`);
                }
                const metadata = await response.json();
                console.log("Fetched metadata:", metadata);

                let mediaUrl = metadata.image || metadata.image_url || metadata.imageUrl || metadata.animation_url || ""; // Common property names, include animation_url

                if (!mediaUrl) {
                    console.warn("No image or animation URL found in metadata");
                    setWinnerMedia("error");
                    return;
                }

                // Handle IPFS URIs in the media URL itself
                if (mediaUrl.startsWith("ipfs://")) {
                     const mediaCid = mediaUrl.split("ipfs://")[1];
                    mediaUrl = `https://gateway.pinata.cloud/ipfs/${mediaCid}`;
                     // mediaUrl = `https://ipfs.io/ipfs/${mediaCid}`;
                } else if (!mediaUrl.startsWith("http")) {
                     console.warn("Media URL might be invalid or non-standard:", mediaUrl);
                     // You might need base URI logic here too depending on the NFT source
                     setWinnerMedia("error");
                     return;
                 }


                 console.log("Setting winner media URL:", mediaUrl);
                setWinnerMedia(mediaUrl);

            } catch (err) {
                 clearTimeout(timeoutId); // Clear timeout on error
                console.error("Error fetching winner media:", err.name === 'AbortError' ? 'Timeout fetching media' : err);
                setWinnerMedia("error"); // Indicate error state
            }
        } else if (winnerDetails && !winnerDetails.tokenURI) {
             console.log("Winner details found, but no tokenURI present.");
             setWinnerMedia("no_uri"); // Specific state for no URI
        }
         else {
            setWinnerMedia(""); // Clear media if no winner details
        }
    }
    fetchWinnerMedia();
  }, [winnerDetails]); // Dependency: only run when winnerDetails object changes


  // --- STYLES --- (Embedded for simplicity - Keep the same styles as before, maybe add one for rules)
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Roboto:wght@300;400;700&display=swap');

    :root {
        --neon-cyan: #00ffff;
        --neon-magenta: #ff00ff;
        --neon-gold: #ffd700;
        --dark-bg-start: #1a0a2e;
        --dark-bg-end: #0d0517;
        --text-primary: #e0e0e0;
        --text-secondary: #aaa;
        --border-glow-color: rgba(0, 255, 255, 0.3);
        --card-bg: rgba(255, 255, 255, 0.05);
    }

    .battle-page {
      font-family: 'Roboto', sans-serif;
      background: linear-gradient(135deg, var(--dark-bg-start) 0%, var(--dark-bg-end) 100%);
      color: var(--text-primary);
      min-height: 100vh;
      padding: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .battle-container {
        width: 100%;
        max-width: 1200px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); /* Adjust minmax slightly if needed */
        gap: 40px;
        margin-top: 30px;
    }

    .main-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 3.5rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 10px;
      color: #ffffff;
      text-shadow: 0 0 10px var(--neon-magenta), 0 0 20px var(--neon-magenta), 0 0 30px var(--neon-cyan), 0 0 40px var(--neon-cyan);
      animation: glow 1.5s ease-in-out infinite alternate;
    }

     @keyframes glow {
      from {
        text-shadow: 0 0 5px var(--neon-magenta), 0 0 10px var(--neon-magenta), 0 0 15px var(--neon-cyan), 0 0 20px var(--neon-cyan);
      }
      to {
        text-shadow: 0 0 10px var(--neon-magenta), 0 0 20px var(--neon-magenta), 0 0 30px var(--neon-cyan), 0 0 40px var(--neon-cyan), 0 0 50px var(--neon-magenta);
      }
    }


    .header-info {
        text-align: center;
        margin-bottom: 30px;
        font-size: 0.9rem;
        color: var(--text-secondary);
        display: flex; /* Use flexbox for alignment */
        flex-wrap: wrap; /* Allow wrapping on small screens */
        justify-content: center; /* Center items */
        gap: 15px; /* Space between items */
    }
    .header-info strong {
        color: var(--text-primary);
    }
    .header-info span {
        display: inline-block;
        padding: 5px 12px;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        border: 1px solid var(--border-glow-color);
         white-space: nowrap; /* Prevent wrapping inside span */
    }
     .connect-wallet-prompt {
         padding: 8px 15px;
         background-color: rgba(255, 200, 0, 0.2);
         border: 1px solid rgba(255, 200, 0, 0.5);
         color: #ffcc00;
         border-radius: 4px;
     }

    .battle-section {
      background-color: var(--card-bg);
      border: 1px solid var(--border-glow-color);
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.1);
      transition: box-shadow 0.3s ease;
      backdrop-filter: blur(5px); /* Subtle glass effect */
       display: flex; /* Use flexbox for internal layout */
       flex-direction: column; /* Stack elements vertically */
    }
    .battle-section:hover {
      box-shadow: 0 0 25px rgba(0, 255, 255, 0.3);
    }

    .section-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 1.8rem;
      color: var(--neon-cyan);
      margin-bottom: 20px;
      border-bottom: 1px solid rgba(0, 255, 255, 0.5);
      padding-bottom: 10px;
      text-shadow: 0 0 5px var(--neon-cyan);
    }

    .input-group {
      margin-bottom: 15px;
      display: flex;
      flex-direction: column;
    }
    .input-group label {
        margin-bottom: 5px;
        font-size: 0.9rem;
        color: var(--text-secondary);
    }

    .input-field {
      background-color: rgba(0, 0, 0, 0.3);
      border: 1px solid #444;
      border-radius: 6px;
      padding: 12px 15px;
      color: var(--text-primary);
      font-size: 1rem;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
       width: 100%; /* Make inputs fill container */
       box-sizing: border-box; /* Include padding/border in width */
    }
    .input-field:focus {
      outline: none;
      border-color: var(--neon-cyan);
      box-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
    }
     .input-field::placeholder {
         color: #777;
     }
      /* Hide spinner buttons on number inputs */
     .input-field[type=number]::-webkit-inner-spin-button,
     .input-field[type=number]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
     }
     .input-field[type=number] {
        -moz-appearance: textfield; /* Firefox */
     }


    .btn {
      font-family: 'Orbitron', sans-serif;
      background: linear-gradient(90deg, var(--neon-magenta), var(--neon-cyan));
      color: #000; /* Black text for contrast on bright button */
      border: none;
      border-radius: 6px;
      padding: 12px 25px;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: inline-flex; /* Use inline-flex to align spinner and text */
      align-items: center;
      justify-content: center;
      min-width: 150px; /* Ensure buttons have a consistent minimum width */
      text-align: center; /* Center text */
    }
    .btn:hover:not(:disabled) {
      box-shadow: 0 0 15px var(--neon-magenta), 0 0 15px var(--neon-cyan);
      transform: translateY(-2px);
    }
    .btn:disabled {
      background: #555;
      color: #999;
      cursor: not-allowed;
      opacity: 0.7;
    }
    .btn-secondary {
        background: transparent;
        border: 1px solid var(--neon-cyan);
        color: var(--neon-cyan);
    }
    .btn-secondary:hover:not(:disabled) {
        background: rgba(0, 255, 255, 0.1);
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
         transform: translateY(-1px);
    }
     .btn-secondary:disabled {
      border-color: #555;
      color: #777;
      background: transparent;
    }

    .loading-spinner {
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #fff;
      width: 18px;
      height: 18px;
      animation: spin 1s linear infinite; /* Changed timing to linear */
      margin: 0 8px 0 -5px; /* Adjust margins for better alignment */
    }
    /* Specific spinner color for primary button */
    .btn:not(.btn-secondary) .loading-spinner {
        border-top-color: #000; /* Match button text */
         border-left-color: #000; /* Make it more visible */
    }


     @keyframes spin {
      to { transform: rotate(360deg); }
    }


    .entries-list {
      list-style: none;
      padding: 0;
      margin-top: 15px;
      flex-grow: 1; /* Allow list to take available space */
      max-height: 300px; /* Limit height and allow scrolling */
      overflow-y: auto;
       scrollbar-width: thin; /* Firefox */
       scrollbar-color: var(--neon-cyan) rgba(0, 0, 0, 0.3); /* Firefox */
    }
     /* Webkit scrollbar styling */
    .entries-list::-webkit-scrollbar {
      width: 8px;
    }
    .entries-list::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
    }
    .entries-list::-webkit-scrollbar-thumb {
      background-color: var(--neon-cyan);
      border-radius: 4px;
       border: 2px solid transparent;
       background-clip: content-box;
    }


    .entry-item {
      background-color: rgba(255, 255, 255, 0.08);
      border-left: 4px solid var(--neon-magenta);
      padding: 10px 15px; /* Slightly reduced padding */
      margin-bottom: 8px; /* Slightly reduced margin */
      border-radius: 4px;
      font-size: 0.85rem; /* Slightly smaller font */
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap; /* Allow wrapping on smaller screens */
      gap: 10px; /* Add gap between items */
    }
     .entry-item span { margin: 0; } /* Remove default margin */
     .entry-item strong { color: var(--neon-cyan); margin-right: 5px;}


    .winner-section {
       border-color: var(--neon-gold); /* Gold border for winner */
       box-shadow: 0 0 25px rgba(255, 215, 0, 0.3);
    }
    .winner-section:hover {
       box-shadow: 0 0 35px rgba(255, 215, 0, 0.5); /* Enhanced hover */
    }
    .winner-section .section-title {
        color: var(--neon-gold);
        border-bottom-color: rgba(255, 215, 0, 0.5);
        text-shadow: 0 0 8px var(--neon-gold);
    }

    .winner-details {
        margin-top: 15px;
        padding: 15px;
        background: rgba(255, 215, 0, 0.05);
        border-radius: 8px;
        border: 1px solid rgba(255, 215, 0, 0.2); /* Subtle inner border */
    }
    .winner-details p {
        margin: 8px 0;
        font-size: 0.9rem; /* Slightly smaller font */
        display: flex;
        align-items: center;
        gap: 10px;
    }
     .winner-details p strong {
         color: var(--neon-gold);
         min-width: 90px; /* Align keys */
         display: inline-block;
         text-align: right; /* Align keys to the right */
     }
     .winner-details p span {
         color: var(--text-primary); /* Ensure value text color */
         word-break: break-all; /* Break long addresses */
     }

    .winner-nft-media {
        margin-top: 20px;
        text-align: center;
         flex-grow: 1; /* Allow media to take space if details are short */
         display: flex;
         flex-direction: column;
    }
    .winner-nft-media strong {
        display: block;
        margin-bottom: 15px;
        color: var(--neon-gold);
        font-size: 1.1rem;
    }
    .winner-nft-image {
      width: 100%; /* Make image responsive */
      max-width: 350px; /* Limit max width */
      height: auto;
      max-height: 300px; /* Limit max height */
      object-fit: cover; /* Cover the area, might crop */
      border-radius: 8px;
      border: 2px solid var(--neon-gold);
      box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
      background-color: rgba(0,0,0,0.5); /* Placeholder background */
       margin: 0 auto; /* Center image */
    }
    .media-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 150px; /* Adjust as needed */
        width: 100%;
        max-width: 350px;
        margin: 0 auto;
        padding: 20px;
        box-sizing: border-box;
        background-color: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        border: 1px dashed var(--text-secondary);
        color: var(--text-secondary);
         flex-grow: 1;
    }
    .media-loading .loading-spinner { /* Center spinner */
        margin: 0;
        width: 30px; /* Larger spinner */
        height: 30px;
        border-width: 4px;
         border-top-color: var(--neon-gold); /* Gold spinner */
         border-left-color: var(--neon-gold);
    }


    .organizer-panel {
        background-color: rgba(255, 0, 255, 0.1); /* Distinct background */
        border-color: rgba(255, 0, 255, 0.4);
        box-shadow: 0 0 15px rgba(255, 0, 255, 0.2);
    }
     .organizer-panel:hover {
        box-shadow: 0 0 25px rgba(255, 0, 255, 0.4);
    }
    .organizer-panel .section-title {
        color: var(--neon-magenta);
        border-bottom-color: rgba(255, 0, 255, 0.5);
        text-shadow: 0 0 5px var(--neon-magenta);
    }
     .organizer-panel .btn {
         background: linear-gradient(90deg, #c300ff, #ff0095); /* More intense gradient */
     }
      .organizer-panel .btn:hover:not(:disabled) {
        box-shadow: 0 0 15px var(--neon-magenta), 0 0 15px #ff0095;
    }

    /* New Styles for Rules Section */
    .rules-section {
        border-color: rgba(200, 200, 200, 0.4); /* Muted border */
        background-color: rgba(50, 50, 70, 0.1); /* Slightly different subtle bg */
        box-shadow: 0 0 15px rgba(200, 200, 200, 0.1);
    }
    .rules-section:hover {
        box-shadow: 0 0 20px rgba(200, 200, 200, 0.2);
    }
    .rules-section .section-title {
        color: #cccccc; /* Muted title color */
        border-bottom-color: rgba(200, 200, 200, 0.3);
        text-shadow: 0 0 5px rgba(200, 200, 200, 0.5);
    }
    .rules-content {
        font-size: 0.9rem;
        color: var(--text-secondary);
        line-height: 1.6;
    }
     .rules-content ul {
         list-style: disc;
         padding-left: 20px;
         margin-top: 10px;
     }
     .rules-content li {
         margin-bottom: 8px;
     }
     .rules-content strong {
         color: var(--text-primary); /* Highlight key terms */
     }

    .message {
        text-align: center;
        color: var(--text-secondary);
        margin-top: 20px;
        font-style: italic;
        padding: 10px;
        flex-grow: 1; /* Allow message to take space */
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* Basic Responsiveness */
    @media (max-width: 900px) {
       .battle-container {
           /* Grid handles wrapping automatically due to auto-fit */
           max-width: 600px; /* Adjust max width for single column */
       }
       .main-title {
           font-size: 2.5rem;
       }
    }
     @media (max-width: 500px) {
         .battle-page { padding: 15px; }
          .battle-container {
             grid-template-columns: 1fr; /* Force single column */
             max-width: 100%;
             gap: 25px; /* Reduce gap */
         }
         .main-title { font-size: 2rem; }
         .section-title { font-size: 1.5rem; }
         .btn { padding: 10px 20px; font-size: 0.9rem; min-width: 120px;}
         .input-field { padding: 10px 12px; font-size: 0.9rem;}
         .entry-item { font-size: 0.8rem; flex-direction: column; align-items: flex-start; gap: 5px; }
         .header-info { font-size: 0.8rem; gap: 8px;}
         .header-info span { padding: 4px 8px; }
         .winner-details p { font-size: 0.85rem; flex-direction: column; align-items: flex-start; gap: 3px;}
         .winner-details p strong { min-width: auto; text-align: left;}
         .winner-nft-image { max-width: 100%; max-height: 250px;}
     }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="battle-page">
        <h1 className="main-title">NFT Battle Arena</h1>
        <div className="header-info">
           {currentAccount ? (
              <>
                 <span><strong>Account:</strong> {shortenAddress(currentAccount)}</span>
                 <span><strong>Current Battle:</strong> #{battleId}</span>
                 {isOwner && <span>👑 Organizer</span>}
              </>
           ) : (
             <span className="connect-wallet-prompt">Please connect your wallet</span>
           )}
        </div>

        {/* Grid container with reordered items */}
        <div className="battle-container">

            {/* 1. Enter Battle Section (Remains First) */}
            <section className="battle-section">
              <h2 className="section-title">Enter the Arena</h2>
              <div className="input-group">
                 <label htmlFor="tokenId">Your NFT Token ID</label>
                <input
                  id="tokenId"
                  type="number"
                  placeholder="e.g., 123"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  className="input-field"
                  disabled={loading || !currentAccount || !battleContract}
                />
              </div>
              <div className="input-group">
                 <label htmlFor="stakeAmount">Stake Amount (ETH)</label>
                <input
                  id="stakeAmount"
                  type="number"
                  step="0.001" // Allow smaller increments
                  min="0"
                  placeholder="e.g., 0.1"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="input-field"
                  disabled={loading || !currentAccount || !battleContract}
                />
              </div>
              <button onClick={enterBattle} disabled={loading || !currentAccount || !battleContract} className="btn" style={{marginTop: 'auto'}}> {/* Push button down */}
                 {loading && !entriesLoading && !winnerLoading && <div className="loading-spinner"></div>}
                 {loading && !entriesLoading && !winnerLoading ? "Entering..." : "Enter Battle"}
              </button>
               {!currentAccount && <p className="message" style={{color: '#ffcc00', marginTop: '10px'}}>Connect wallet to enter</p>}
            </section>

            {/* 2. Organizer Controls OR Battle Rules Section (Conditional) */}
            {isOwner ? (
                <section className="battle-section organizer-panel">
                    <h2 className="section-title">Organizer Controls</h2>
                    <p style={{marginBottom: '15px', color: '#eee'}}>Declare the winner for the current battle (#{battleId}). This will end the current battle and start the next one.</p>
                    <button onClick={declareWinner} disabled={loading || !currentAccount || !battleContract} className="btn" style={{marginTop: 'auto'}}> {/* Push button down */}
                        {loading && !entriesLoading && !winnerLoading && <div className="loading-spinner"></div>}
                        {loading && !entriesLoading && !winnerLoading ? "Declaring..." : "Declare Winner"}
                    </button>
                </section>
             ) : (
                // Show Battle Rules if not the owner
                <section className="battle-section rules-section">
                    <h2 className="section-title">Battle Rules</h2>
                    <div className="rules-content">
                        <p>Welcome to the NFT Battle Arena!</p>
                        <ul>
                            <li>Connect your wallet to participate.</li>
                            <li>Enter the <strong>Token ID</strong> of the NFT you wish to battle with (must be from the approved collection).</li>
                            <li>Specify the amount of <strong>ETH to stake</strong> for this battle.</li>
                            <li>Click <strong>"Enter Battle"</strong> to submit your NFT and stake.</li>
                            <li>Only one entry per wallet per battle.</li>
                            <li>Once the entry period closes, the Organizer will declare a winner.</li>
                            <li>The winner receives a portion of the total staked ETH pot.</li>
                            <li>The winning NFT gets featured in the <strong>Hall of Champions!</strong></li>
                        </ul>
                        <p style={{marginTop: '15px'}}><strong>Good luck, Contender!</strong></p>
                    </div>
                </section>
             )}

             {/* 3. Winner Spotlight Section (Remains Third) */}
             <section className="battle-section winner-section">
                 {/* Use winnerDetails.battleIndex + 1 for display if available, else use battleId-1 */}
                <h2 className="section-title">Hall of Champions (Battle #{winnerDetails ? winnerDetails.battleIndex + 1 : (battleId > 0 ? battleId - 1 : 'N/A')})</h2>
                 <button onClick={() => fetchWinner(battleId)} disabled={winnerLoading || !currentAccount || !battleContract || battleId === 0} className="btn btn-secondary" style={{marginBottom: '15px'}}>
                    {winnerLoading && <div className="loading-spinner"></div>}
                    {winnerLoading ? "Fetching..." : "Show Last Winner"}
                </button>

                {winnerLoading && <div className="message"><div className="loading-spinner" style={{ borderTopColor: 'var(--neon-gold)', borderLeftColor: 'var(--neon-gold)' }}></div>Loading Winner...</div>}

                {!winnerLoading && winnerDetails ? (
                <div className="winner-details">
                    <p><strong>Winner:</strong> <span>{shortenAddress(winnerDetails.winner)}</span></p>
                    <p><strong>Token ID:</strong> <span>{winnerDetails.tokenId}</span></p>
                    <p><strong>Category:</strong> <span>{winnerDetails.category || 'N/A'}</span></p>
                    <p><strong>Reward:</strong> <span>{ethers.formatEther(winnerDetails.reward || 0)} ETH</span></p>

                    <div className="winner-nft-media">
                        <strong>Victor's NFT</strong>
                        {winnerMedia === "loading" ? (
                            <div className="media-placeholder media-loading">
                                <div className="loading-spinner"></div>
                            </div>
                        ) : winnerMedia === "error" ? (
                             <div className="media-placeholder">
                                <span>Error loading media</span>
                            </div>
                         ) : winnerMedia === "no_uri" ? (
                             <div className="media-placeholder">
                                <span>No media URI found</span>
                            </div>
                        ) : winnerMedia ? (
                            // Basic check if it's a video or image based on common extensions
                            /\.(mp4|webm|mov)$/i.test(winnerMedia) ? (
                               <video src={winnerMedia} className="winner-nft-image" controls autoPlay muted loop playsInline />
                            ) : (
                               <img src={winnerMedia} alt={`Winner NFT ${winnerDetails.tokenId}`} className="winner-nft-image" />
                            )
                        ) : (
                             <div className="media-placeholder">
                                <span>Media Pending...</span>
                            </div>
                        )}
                    </div>
                </div>
                ) : (
                 !winnerLoading && <p className="message">{battleId === 0 ? "No battles have concluded yet." : "No winner details found for the last battle."}</p>
                )}
            </section>


            {/* 4. Current Entries Section (Moved to Fourth) */}
            <section className="battle-section">
              <h2 className="section-title">Current Contenders (Battle #{battleId})</h2>
              <button onClick={fetchEntries} disabled={entriesLoading || !currentAccount || !battleContract} className="btn btn-secondary" style={{marginBottom: '15px'}}>
                 {entriesLoading && <div className="loading-spinner"></div>}
                 {entriesLoading ? "Fetching..." : "Refresh Entries"}
              </button>
              {entriesLoading && entries.length === 0 && <div className="message"><div className="loading-spinner"></div>Loading entries...</div>}
              {!entriesLoading && entries.length > 0 ? (
                <ul className="entries-list">
                  {entries.map((entry, idx) => (
                    <li key={idx} className="entry-item">
                       <span><strong>Player:</strong> {shortenAddress(entry.player)}</span>
                       <span><strong>Token ID:</strong> {entry.tokenId}</span>
                       <span><strong>Category:</strong> {entry.name || 'N/A'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                !entriesLoading && <p className="message">No contenders yet for Battle #{battleId}. Be the first!</p>
              )}
            </section>

         </div> {/* End battle-container */}
      </div> {/* End battle-page */}
    </>
  );
}