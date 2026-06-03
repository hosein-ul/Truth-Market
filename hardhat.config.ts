import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-network-helpers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "solidity-coverage";
import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

import "./tasks/accounts";
import "./tasks/truthmarket";

dotenv.config();

const MNEMONIC: string =
  process.env.MNEMONIC ?? "test test test test test test test test test test test junk";
const PRIVATE_KEY: string | undefined = process.env.PRIVATE_KEY;
const SEPOLIA_RPC_URL: string =
  process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";
const ETHERSCAN_API_KEY: string = process.env.ETHERSCAN_API_KEY ?? "";

const sepoliaAccounts = PRIVATE_KEY
  ? [PRIVATE_KEY]
  : { mnemonic: MNEMONIC, path: "m/44'/60'/0'/0/", initialIndex: 0, count: 10 };

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
    oracle: 1,
    alice: 2,
    bob: 3,
    carol: 4,
  },
  networks: {
    hardhat: {
      accounts: { mnemonic: MNEMONIC, count: 10 },
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: { mnemonic: MNEMONIC, count: 10 },
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: sepoliaAccounts as any,
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: { enabled: true, runs: 800 },
      evmVersion: "cancun",
      metadata: { bytecodeHash: "none" },
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./deploy",
    deployments: "./deployments",
  },
  mocha: { timeout: 200000 },
  gasReporter: { enabled: process.env.REPORT_GAS === "true" },
};

export default config;
