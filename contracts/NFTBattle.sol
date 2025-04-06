// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface INFTMarketplace {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getListedTokenForId(uint256 tokenId) external view returns (
        uint256, address payable, address payable, uint256, bool, uint8
    );
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

contract NFTBattle {
    address public owner;
    INFTMarketplace public nftContract;

    uint256 public totalETHStaked;
    uint256 public battleId;

    struct BattleEntry {
        address player;
        uint256 tokenId;
        string name;
    }

    struct BattleWinnerDetails {
        address winner;
        uint256 tokenId;
        string category;
        string tokenURI;
        uint256 reward;
    }

    mapping(uint256 => BattleEntry[]) public battles;
    mapping(uint256 => BattleWinnerDetails) public battleWinners;
    mapping(uint256 => mapping(address => bool)) public hasEnteredBattle;

    event BattleEntered(address indexed player, uint256 tokenId, string category);
    event BattleWinnerDeclared(address indexed winner, uint256 tokenId, string category, string tokenURI, uint256 reward);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    constructor(address _nftContractAddress) {
    owner = msg.sender;
    nftContract = INFTMarketplace(_nftContractAddress);
}

    function enterBattle(uint256 tokenId) public payable {
        require(msg.value > 0, "Must send some ETH to enter");
        require(nftContract.ownerOf(tokenId) == msg.sender, "You must own this NFT");
        require(!hasEnteredBattle[battleId][msg.sender], "You have already entered this battle");

        (, , , , , uint8 category) = nftContract.getListedTokenForId(tokenId);
        string memory categoryName = _getCategoryName(category);

        totalETHStaked += msg.value;

        battles[battleId].push(BattleEntry({
            player: msg.sender,
            tokenId: tokenId,
            name: categoryName
        }));

        hasEnteredBattle[battleId][msg.sender] = true;
        emit BattleEntered(msg.sender, tokenId, categoryName);
    }

    function declareWinner() public onlyOwner {
        require(battles[battleId].length > 1, "Not enough players");

        uint256 winnerIndex = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, battleId))) % battles[battleId].length;
        BattleEntry memory winner = battles[battleId][winnerIndex];

        uint256 reward = (totalETHStaked * 70) / 100;
        uint256 ownerCut = totalETHStaked - reward;

        string memory uri = nftContract.tokenURI(winner.tokenId);

        (bool sent, ) = payable(winner.player).call{value: reward}("");
        require(sent, "ETH transfer to winner failed");

        (bool sentToOwner, ) = payable(owner).call{value: ownerCut}("");
        require(sentToOwner, "ETH transfer to owner failed");


        battleWinners[battleId] = BattleWinnerDetails({
            winner: winner.player,
            tokenId: winner.tokenId,
            category: winner.name,
            tokenURI: uri,
            reward: reward
        });

        emit BattleWinnerDeclared(winner.player, winner.tokenId, winner.name, uri, reward);

        battleId++;
        totalETHStaked = 0;
    }

    function getBattleEntries(uint256 _battleId) public view returns (BattleEntry[] memory) {
        return battles[_battleId];
    }

    function getWinnerDetails(uint256 _battleId) public view returns (BattleWinnerDetails memory) {
        return battleWinners[_battleId];
    }

    function _getCategoryName(uint8 category) internal pure returns (string memory) {
        if (category == 0) return "Artwork";
        if (category == 1) return "Video";
        if (category == 2) return "GIF";
        return "Unknown";
    }

    receive() external payable {}
}