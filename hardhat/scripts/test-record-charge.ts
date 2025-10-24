import { network, artifacts } from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Contract addresses
const PALMPAY_ADDRESS = "0xcBDF0548025C208bAB08831E43514B6F1693F8c5";
const PAYMENT_TOKEN_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9"; // pyUSD on Sepolia

async function main() {
  console.log("Testing recordCharge function on PalmPay contract...\n");

  // Connect to network
  const { ethers } = await network.connect();

  // Get private keys from .env
  const customerPrivateKey = process.env.SEPOLIA_PRIVATE_KEY;
  const storePrivateKey = process.env.PKEY_STORE;

  if (!customerPrivateKey) {
    throw new Error("SEPOLIA_PRIVATE_KEY not found in .env");
  }
  if (!storePrivateKey) {
    throw new Error("PKEY_STORE not found in .env");
  }

  // Create signers
  const customerSigner = new ethers.Wallet(customerPrivateKey, ethers.provider);
  const storeSigner = new ethers.Wallet(storePrivateKey, ethers.provider);

  console.log("Customer Address:", customerSigner.address);
  console.log("Store Address:", storeSigner.address);
  console.log();

  // Get contract instances
  const PalmPayArtifact = await artifacts.readArtifact("PalmPay");
  const PalmPay = new ethers.Contract(PALMPAY_ADDRESS, PalmPayArtifact.abi, ethers.provider);

  // ERC20 ABI for approve and balanceOf
  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)"
  ];
  const PaymentToken = new ethers.Contract(PAYMENT_TOKEN_ADDRESS, ERC20_ABI, ethers.provider);

  // Check backend verifier
  const backendVerifier = await PalmPay.backendVerifier();
  console.log("Backend Verifier:", backendVerifier);

  if (backendVerifier.toLowerCase() !== customerSigner.address.toLowerCase()) {
    console.warn("⚠️  Warning: Customer is not the backend verifier!");
    console.warn("Expected:", backendVerifier);
    console.warn("Got:", customerSigner.address);
    console.warn("recordCharge can only be called by the backend verifier\n");
  }
  console.log();

  // Step 1: Check customer balance
  console.log("=== Step 1: Check Customer Balance ===");
  const customerBalance = await PaymentToken.balanceOf(customerSigner.address);
  console.log(`Customer pyUSD Balance: ${ethers.formatUnits(customerBalance, 6)} pyUSD`);

  if (customerBalance < ethers.parseUnits("10", 6)) {
    throw new Error("Customer doesn't have enough pyUSD balance");
  }
  console.log();

  // Step 2: Approve PalmPay contract to spend 10 pyUSD
  console.log("=== Step 2: Approve PalmPay Contract ===");
  const approveAmount = ethers.parseUnits("10", 6); // 10 pyUSD (6 decimals)

  const currentAllowance = await PaymentToken.allowance(customerSigner.address, PALMPAY_ADDRESS);
  console.log(`Current Allowance: ${ethers.formatUnits(currentAllowance, 6)} pyUSD`);

  if (currentAllowance < approveAmount) {
    console.log(`Approving ${ethers.formatUnits(approveAmount, 6)} pyUSD...`);
    const approveTx = await PaymentToken.connect(customerSigner).approve(PALMPAY_ADDRESS, approveAmount);
    console.log("Approval transaction hash:", approveTx.hash);
    await approveTx.wait();
    console.log("✓ Approval confirmed");
  } else {
    console.log("✓ Already approved");
  }
  console.log();

  // Step 3: Register customer if needed
  console.log("=== Step 3: Register Customer ===");
  const customerSettings = await PalmPay.getCustomerSettings(customerSigner.address);
  console.log(`Customer Active: ${customerSettings.active}`);
  console.log(`Customer Nonce: ${customerSettings.nonce}`);

  if (!customerSettings.active) {
    console.log("Registering customer...");
    const registerTx = await PalmPay.connect(customerSigner).registerCustomer();
    console.log("Registration transaction hash:", registerTx.hash);
    await registerTx.wait();
    console.log("✓ Customer registered");
  } else {
    console.log("✓ Customer already registered");
  }
  console.log();

  // Step 4: Register store if needed
  console.log("=== Step 4: Register Store ===");
  const storeInfo = await PalmPay.getStoreInfo(storeSigner.address);
  console.log(`Store Active: ${storeInfo.active}`);

  if (!storeInfo.active && storeInfo.name === "") {
    console.log("Registering store...");
    const registerStoreTx = await PalmPay.connect(storeSigner).registerStore("Test Store", "Test City");
    console.log("Store registration transaction hash:", registerStoreTx.hash);
    await registerStoreTx.wait();
    console.log("✓ Store registered");
  } else {
    console.log("✓ Store already registered");
    console.log(`Store Name: ${storeInfo.name}`);
    console.log(`Store City: ${storeInfo.city}`);
  }
  console.log();

  // Step 5: Get updated customer nonce
  const updatedCustomerSettings = await PalmPay.getCustomerSettings(customerSigner.address);
  const currentNonce = updatedCustomerSettings.nonce;
  console.log(`Customer Current Nonce: ${currentNonce}`);
  console.log();

  // Step 6: Record charge (transfer 2 pyUSD from customer to store)
  console.log("=== Step 5: Record Charge ===");
  const chargeAmount = ethers.parseUnits("2", 6); // 2 pyUSD
  const receiptHash = ethers.keccak256(ethers.toUtf8Bytes(`receipt-${Date.now()}`));

  console.log(`Charging ${ethers.formatUnits(chargeAmount, 6)} pyUSD from customer to store...`);
  console.log(`Customer: ${customerSigner.address}`);
  console.log(`Store: ${storeSigner.address}`);
  console.log(`Amount: ${ethers.formatUnits(chargeAmount, 6)} pyUSD`);
  console.log(`Nonce: ${currentNonce}`);
  console.log(`Receipt Hash: ${receiptHash}`);
  console.log();

  // Check balances before
  const storeBalanceBefore = await PaymentToken.balanceOf(storeSigner.address);
  const customerBalanceBefore = await PaymentToken.balanceOf(customerSigner.address);
  console.log("Balances before charge:");
  console.log(`  Customer: ${ethers.formatUnits(customerBalanceBefore, 6)} pyUSD`);
  console.log(`  Store: ${ethers.formatUnits(storeBalanceBefore, 6)} pyUSD`);
  console.log();

  try {
    const recordChargeTx = await PalmPay.connect(customerSigner).recordCharge(
      customerSigner.address,
      storeSigner.address,
      chargeAmount,
      currentNonce,
      receiptHash
    );
    console.log("Record charge transaction hash:", recordChargeTx.hash);
    const receipt = await recordChargeTx.wait();
    console.log("✓ Charge recorded successfully");
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    console.log();

    // Check balances after
    const storeBalanceAfter = await PaymentToken.balanceOf(storeSigner.address);
    const customerBalanceAfter = await PaymentToken.balanceOf(customerSigner.address);
    console.log("Balances after charge:");
    console.log(`  Customer: ${ethers.formatUnits(customerBalanceAfter, 6)} pyUSD`);
    console.log(`  Store: ${ethers.formatUnits(storeBalanceAfter, 6)} pyUSD`);
    console.log();

    console.log("Change:");
    console.log(`  Customer: ${ethers.formatUnits(customerBalanceAfter - customerBalanceBefore, 6)} pyUSD`);
    console.log(`  Store: ${ethers.formatUnits(storeBalanceAfter - storeBalanceBefore, 6)} pyUSD`);
    console.log();

    // Get updated nonce
    const finalCustomerSettings = await PalmPay.getCustomerSettings(customerSigner.address);
    console.log(`Customer New Nonce: ${finalCustomerSettings.nonce}`);
    console.log();

    console.log("✅ Test completed successfully!");

  } catch (error: any) {
    console.error("❌ Error recording charge:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
