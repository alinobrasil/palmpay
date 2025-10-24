import { network, artifacts } from "hardhat";

// Contract address on Sepolia
const CONTRACT_ADDRESS = "0xcBDF0548025C208bAB08831E43514B6F1693F8c5";

async function main() {
  console.log("Reading PalmPay contract on Sepolia...");
  console.log("Contract address:", CONTRACT_ADDRESS);
  console.log();

  // Connect to network and get ethers
  const { ethers } = await network.connect();

  // Get the contract instance
  const PalmPayArtifact = await artifacts.readArtifact("PalmPay");
  const PalmPay = new ethers.Contract(CONTRACT_ADDRESS, PalmPayArtifact.abi, ethers.provider);

  // Read backendVerifier
  console.log("=== Backend Verifier ===");
  const backendVerifier = await PalmPay.backendVerifier();
  console.log("Backend Verifier Address:", backendVerifier);
  console.log();

  // You can add more read functions here:

  // Read paymentToken
  console.log("=== Payment Token ===");
  const paymentToken = await PalmPay.paymentToken();
  console.log("Payment Token Address:", paymentToken);
  console.log();

  // Read maxSpendingLimitCeiling
  console.log("=== Max Spending Limit Ceiling ===");
  const maxSpendingLimitCeiling = await PalmPay.maxSpendingLimitCeiling();
  console.log("Max Spending Limit Ceiling:", ethers.formatUnits(maxSpendingLimitCeiling, 6), "pyUSD");
  console.log();

  // Read owner
  console.log("=== Owner ===");
  const owner = await PalmPay.owner();
  console.log("Owner Address:", owner);
  console.log();

  // Example: Get customer settings (uncomment and replace with actual customer address)
  // const customerAddress = "0x...";
  // console.log("=== Customer Settings ===");
  // const customerSettings = await PalmPay.getCustomerSettings(customerAddress);
  // console.log("Customer Address:", customerAddress);
  // console.log("Max Transaction Amount:", ethers.formatUnits(customerSettings.maxTransactionAmount, 6), "pyUSD");
  // console.log("Active:", customerSettings.active);
  // console.log("Nonce:", customerSettings.nonce.toString());
  // console.log();

  // Example: Get store info (uncomment and replace with actual store address)
  // const storeAddress = "0x...";
  // console.log("=== Store Info ===");
  // const storeInfo = await PalmPay.getStoreInfo(storeAddress);
  // console.log("Store Address:", storeAddress);
  // console.log("Name:", storeInfo.name);
  // console.log("City:", storeInfo.city);
  // console.log("Active:", storeInfo.active);
  // console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
