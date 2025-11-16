import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployed = await deploy("NebulaResumeFHE", {
    from: deployer,
    log: true
  });

  console.log(`NebulaResumeFHE contract deployed at: ${deployed.address}`);
};

export default func;
func.id = "deploy_nebulacv_fhe";
func.tags = ["NebulaResumeFHE"];




