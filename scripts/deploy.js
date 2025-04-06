const { ethers, artifacts } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    // Get the first signer (deployer)
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contract with the account: ${deployer.address}`);

    // Get the contract factory
    const ContractFactory = await ethers.getContractFactory("NFTMarketplace", deployer); // Attach signer

    // Deploy the contract
    const contract = await ContractFactory.deploy(/* constructor arguments if any */);

    // Wait for deployment to complete
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log(`Contract deployed to: ${contractAddress}`);

    // Save contract details for the frontend
    saveFrontendFiles(contract, "NFTMarketplace");
}

function saveFrontendFiles(contract, name) {
    const contractsDir = path.join(__dirname, "../src/contract_data/");

    // Ensure the directory exists
    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir, { recursive: true });
    }

    // Save contract address
    fs.writeFileSync(
        path.join(contractsDir, `${name}-address.json`),
        JSON.stringify({ address: contract.target }, null, 2) // Use contract.target for new ethers.js versions
    );

    // Save contract ABI
    const contractArtifact = artifacts.readArtifactSync(name);
    fs.writeFileSync(
        path.join(contractsDir, `${name}.json`),
        JSON.stringify(contractArtifact, null, 2)
    );
}

// Execute the deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
