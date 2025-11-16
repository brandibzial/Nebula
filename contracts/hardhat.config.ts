import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "hardhat-deploy";
import "@fhevm/hardhat-plugin";

// Do not provide any default fallbacks to avoid accidental leakage of secrets
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || "";
const SEPOLIA_PK = process.env.SEPOLIA_PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  namedAccounts: {
    deployer: {
      default: 0
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      chainId: 31337,
      url: "http://127.0.0.1:8545"
    },
    sepolia: {
      chainId: 11155111,
      url: SEPOLIA_RPC,
      accounts: SEPOLIA_PK ? [SEPOLIA_PK] : []
    }
  }
};

export default config;




