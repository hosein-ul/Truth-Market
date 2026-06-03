import { task } from "hardhat/config";

task("accounts", "Prints the list of accounts").setAction(async (_, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const a of accounts) {
    const bal = await hre.ethers.provider.getBalance(a.address);
    console.log(`${a.address}  ${hre.ethers.formatEther(bal)} ETH`);
  }
});
