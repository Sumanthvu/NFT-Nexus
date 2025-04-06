// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

//pay minmting fee
//in listing remove the rewuire statement

contract NFTMarketplace is ERC721URIStorage {
    uint256 private _tokenIds;
    uint256 private _itemsSold;
    address payable public owner;
    uint256 public mintingPrice = 0.00000001 ether;

    // NFT Categories
    enum NFTCategory { Artwork, Video, GIF }

    struct ListedToken {
        uint256 tokenId;
        address payable owner;
        address payable seller;
        uint256 price;
        bool currentlyListed;
        NFTCategory category; // Added category field
    }

    event TokenListedSuccess(
        uint256 indexed tokenId,
        address owner,
        address seller,
        uint256 price,
        bool currentlyListed,
        NFTCategory category
    );

    mapping(uint256 => ListedToken) private idToListedToken;

    constructor() ERC721("NFTMarketplace", "NFTM") {
        owner = payable(msg.sender);
    }

    function updatemintingPrice(uint256 _listPrice) public {
        require(owner == msg.sender, "Only owner can update minting price");
        mintingPrice = _listPrice;
    }

    function getmintingPrice() public view returns (uint256) {
        return mintingPrice;
    }

    function getListedTokenForId(uint256 tokenId) public view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }

    function getCurrentToken() public view returns (uint256) {
        return _tokenIds;
    }

    function mintToken(string memory tokenURI, NFTCategory category) public payable returns (uint256) {
        require(msg.value >= mintingPrice, "Not enough ETH to mint!");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        idToListedToken[newTokenId] = ListedToken(
            newTokenId,
            payable(msg.sender),
            payable(address(0)), // No seller since it's just minted
            0,
            false,
            category
        );

        return newTokenId;
    }

    function createListedToken(uint256 tokenId, uint256 price) public payable {
        require(price > 0, "Price must be greater than zero");
        require(msg.value >= mintingPrice, "Send the correct listing price");//remove this
        require(ownerOf(tokenId) == msg.sender, "You must own the NFT to list it");

        idToListedToken[tokenId].owner = payable(address(this));
        idToListedToken[tokenId].seller = payable(msg.sender);
        idToListedToken[tokenId].price = price;
        idToListedToken[tokenId].currentlyListed = true;

        _transfer(msg.sender, address(this), tokenId);

        emit TokenListedSuccess(
            tokenId,
            address(this),
            msg.sender,
            price,
            true,
            idToListedToken[tokenId].category
        );
    }

    function getAllNFTs() public view returns (ListedToken[] memory) {
        uint256 nftCount = _tokenIds;
        ListedToken[] memory tokens = new ListedToken[](nftCount);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= nftCount; i++) {
            tokens[currentIndex] = idToListedToken[i];
            currentIndex++;
        }

        return tokens;
    }

    function getMyNFTs() public view returns (ListedToken[] memory) {
        uint256 totalItemCount = _tokenIds;
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (idToListedToken[i].owner == msg.sender || idToListedToken[i].seller == msg.sender) {
                itemCount++;
            }
        }

        ListedToken[] memory items = new ListedToken[](itemCount);
        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (idToListedToken[i].owner == msg.sender || idToListedToken[i].seller == msg.sender) {
                items[currentIndex] = idToListedToken[i];
                currentIndex++;
            }
        }

        return items;
    }

    function executeSale(uint256 tokenId) public payable {
        ListedToken storage item = idToListedToken[tokenId];
        require(item.currentlyListed, "NFT not listed for sale");
        require(msg.value == item.price, "Incorrect price sent");

        address seller = item.seller;
        item.currentlyListed = false;
        item.seller = payable(msg.sender);
        _itemsSold++;

        _transfer(address(this), msg.sender, tokenId);
        approve(address(this), tokenId);

        payable(owner).transfer(mintingPrice);
        payable(seller).transfer(msg.value);
    }
}
