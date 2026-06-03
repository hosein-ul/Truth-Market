import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log(`Deploying TruthMarket on ${network.name} from ${deployer}`);

  const mockUsdc = await deploy("MockUSDC", {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true,
  });

  const confidentialUsdc = await deploy("ConfidentialUSDC", {
    from: deployer,
    args: [mockUsdc.address],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  const factory = await deploy("MarketFactory", {
    from: deployer,
    args: [confidentialUsdc.address],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  log("\n─────────────────────────────────────────────");
  log("  TruthMarket addresses");
  log("─────────────────────────────────────────────");
  log(`  MockUSDC          : ${mockUsdc.address}`);
  log(`  ConfidentialUSDC  : ${confidentialUsdc.address}`);
  log(`  MarketFactory     : ${factory.address}`);
  log("─────────────────────────────────────────────\n");
};

func.tags = ["TruthMarket"];
func.id = "truthmarket_v1";

export default func;
