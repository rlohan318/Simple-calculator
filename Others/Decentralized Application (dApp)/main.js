// Advanced Decentralized Application (dApp) Implementation

// Web3 and IPFS configuration
const IPFS = require('ipfs-http-client');
const ipfs = IPFS.create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

// Smart Contract ABIs
const tokenContractABI = [
    // ERC20 Token Interface
    {"inputs": [], "name": "totalSupply", "outputs": [{"type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"type": "address"}], "name": "balanceOf", "outputs": [{"type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"type": "address"}, {"type": "uint256"}], "name": "transfer", "outputs": [{"type": "bool"}], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"type": "address"}, {"type": "address"}, {"type": "uint256"}], "name": "transferFrom", "outputs": [{"type": "bool"}], "stateMutability": "nonpayable", "type": "function"}
];

const nftContractABI = [
    // ERC721 NFT Interface
    {"inputs": [{"type": "uint256"}], "name": "ownerOf", "outputs": [{"type": "address"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"type": "address"}, {"type": "uint256"}], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"type": "uint256"}], "name": "tokenURI", "outputs": [{"type": "string"}], "stateMutability": "view", "type": "function"}
];

const governanceContractABI = [
    // DAO Governance Interface
    {"inputs": [{"type": "uint256"}], "name": "createProposal", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"type": "uint256"}, {"type": "bool"}], "name": "vote", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"type": "uint256"}], "name": "executeProposal", "outputs": [], "stateMutability": "nonpayable", "type": "function"}
];

// Contract addresses (replace with actual addresses)
const CONTRACT_ADDRESSES = {
    TOKEN: '0x0000000000000000000000000000000000000001',
    NFT: '0x0000000000000000000000000000000000000002',
    GOVERNANCE: '0x0000000000000000000000000000000000000003'
};

// Main DApp class
class AdvancedDApp {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.contracts = {};
        this.ipfs = ipfs;
        this.events = new EventEmitter();
    }

    async initialize() {
        await this.setupWeb3();
        await this.setupContracts();
        await this.setupEventListeners();
        await this.loadUserData();
    }

    async setupWeb3() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                this.web3 = new Web3(window.ethereum);
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.account = accounts[0];
                console.log('Connected to wallet:', this.account);
            } catch (error) {
                throw new Error('Failed to connect to Web3: ' + error.message);
            }
        } else {
            throw new Error('Web3 provider not found');
        }
    }

    async setupContracts() {
        this.contracts = {
            token: new this.web3.eth.Contract(tokenContractABI, CONTRACT_ADDRESSES.TOKEN),
            nft: new this.web3.eth.Contract(nftContractABI, CONTRACT_ADDRESSES.NFT),
            governance: new this.web3.eth.Contract(governanceContractABI, CONTRACT_ADDRESSES.GOVERNANCE)
        };
    }

    async setupEventListeners() {
        // Wallet events
        window.ethereum.on('accountsChanged', this.handleAccountChange.bind(this));
        window.ethereum.on('chainChanged', this.handleChainChange.bind(this));

        // Contract events
        this.contracts.token.events.Transfer().on('data', this.handleTransfer.bind(this));
        this.contracts.nft.events.Transfer().on('data', this.handleNFTTransfer.bind(this));
        this.contracts.governance.events.ProposalCreated().on('data', this.handleNewProposal.bind(this));
    }

    // Token Functions
    async getTokenBalance(address) {
        try {
            return await this.contracts.token.methods.balanceOf(address).call();
        } catch (error) {
            console.error('Error getting token balance:', error);
            throw error;
        }
    }

    async transferTokens(to, amount) {
        try {
            return await this.contracts.token.methods.transfer(to, amount)
                .send({ from: this.account });
        } catch (error) {
            console.error('Error transferring tokens:', error);
            throw error;
        }
    }

    // NFT Functions
    async mintNFT(metadata) {
        try {
            const ipfsResult = await this.ipfs.add(JSON.stringify(metadata));
            const tokenURI = `ipfs://${ipfsResult.path}`;
            return await this.contracts.nft.methods.mint(this.account, tokenURI)
                .send({ from: this.account });
        } catch (error) {
            console.error('Error minting NFT:', error);
            throw error;
        }
    }

    async getNFTMetadata(tokenId) {
        try {
            const tokenURI = await this.contracts.nft.methods.tokenURI(tokenId).call();
            const response = await fetch(tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/'));
            return await response.json();
        } catch (error) {
            console.error('Error getting NFT metadata:', error);
            throw error;
        }
    }

    // Governance Functions
    async createProposal(description, actions) {
        try {
            const proposalData = {
                description,
                actions,
                timestamp: Date.now()
            };
            const ipfsResult = await this.ipfs.add(JSON.stringify(proposalData));
            return await this.contracts.governance.methods.createProposal(ipfsResult.path)
                .send({ from: this.account });
        } catch (error) {
            console.error('Error creating proposal:', error);
            throw error;
        }
    }

    async vote(proposalId, support) {
        try {
            return await this.contracts.governance.methods.vote(proposalId, support)
                .send({ from: this.account });
        } catch (error) {
            console.error('Error voting on proposal:', error);
            throw error;
        }
    }

    // Event Handlers
    handleAccountChange(accounts) {
        this.account = accounts[0];
        this.events.emit('accountChanged', this.account);
        this.loadUserData();
    }

    handleChainChange() {
        window.location.reload();
    }

    handleTransfer(event) {
        this.events.emit('tokenTransfer', event.returnValues);
    }

    handleNFTTransfer(event) {
        this.events.emit('nftTransfer', event.returnValues);
    }

    handleNewProposal(event) {
        this.events.emit('newProposal', event.returnValues);
    }

    // State Management
    async loadUserData() {
        try {
            const [tokenBalance, nftBalance, votingPower] = await Promise.all([
                this.getTokenBalance(this.account),
                this.contracts.nft.methods.balanceOf(this.account).call(),
                this.contracts.governance.methods.getVotingPower(this.account).call()
            ]);

            this.userData = {
                address: this.account,
                tokenBalance,
                nftBalance,
                votingPower
            };

            this.events.emit('userDataUpdated', this.userData);
        } catch (error) {
            console.error('Error loading user data:', error);
            throw error;
        }
    }
}

// Initialize DApp
const dapp = new AdvancedDApp();

// Export for use in other modules
module.exports = dapp;

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        dapp.initialize().catch(console.error);
    });
}

// Example usage:
/*
// Token operations
dapp.getTokenBalance(userAddress).then(console.log);
dapp.transferTokens(recipientAddress, amount).then(console.log);

// NFT operations
dapp.mintNFT({
    name: "My NFT",
    description: "A unique digital asset",
    image: "ipfs://..."
}).then(console.log);

// Governance operations
dapp.createProposal(
    "Community Fund Allocation",
    [{target: contractAddress, value: 0, data: "0x..."}]
).then(console.log);
*/

