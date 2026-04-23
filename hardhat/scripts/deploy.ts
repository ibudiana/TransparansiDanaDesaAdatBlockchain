import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "localhost",
  chainType: "op",
});

async function main() {
  console.log("Deploying DanaUpacaraDesaAdat contract...");

  // Pilih wallet/deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  // Deploy contract
  const DanaUpacaraDesaAdat = await ethers.getContractFactory(
    "DanaUpacaraDesaAdat",
  );
  const contract = await DanaUpacaraDesaAdat.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();

  const net = await ethers.provider.getNetwork();

  console.log("DanaUpacaraDesaAdat deployed successfully!");
  console.log(`Contract Address: ${address}`);
  console.log("Chain ID:", net.chainId);
}

// Menjalankan script deploy
main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
