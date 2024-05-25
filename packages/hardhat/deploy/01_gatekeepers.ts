import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { GatekeeperContractName } from "../constants";

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  let args: string[] = [];

  if (GatekeeperContractName === "ZupassGatekeeper") {
    await hre.deployments.deploy("Groth16Verifier", {
      from: deployer,
      args: [],
      log: true,
      autoMine: true,
    });

    const verifier = await hre.ethers.getContract("Groth16Verifier", deployer);
    const verifierAddress = await verifier.getAddress();
    console.log(`The Groth16Verifier is deployed at ${verifierAddress}`);
    args = [
      "111560146890584288369567824893314450802", // ETHBerlin event ID
      "13908133709081944902758389525983124100292637002438232157513257158004852609027", // ETHBerlin event signer[0]
      "7654374482676219729919246464135900991450848628968334062174564799457623790084", // ETHBerlin event signer[1]+
      verifierAddress,
    ];
  }

  await hre.deployments.deploy(GatekeeperContractName, {
    from: deployer,
    args,
    log: true,
    autoMine: true,
  });

  const gatekeeper = await hre.ethers.getContract(GatekeeperContractName, deployer);
  console.log(`The gatekeeper is deployed at ${await gatekeeper.getAddress()}`);
};

export default deployContracts;

deployContracts.tags = ["Gatekeeper"];
