import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PalmPayModule = buildModule("PalmPayModule", (m) => {
  // Parameters for deployment
  // TODO: Replace these with actual addresses before deploying
  const paymentTokenAddress = m.getParameter("paymentToken", "0x0000000000000000000000000000000000000000"); // Replace with pyUSD address
  const backendVerifierAddress = m.getParameter("backendVerifier", "0x0000000000000000000000000000000000000000"); // Replace with backend wallet address

  // Deploy PalmPay contract
  const palmPay = m.contract("PalmPay", [paymentTokenAddress, backendVerifierAddress]);

  return { palmPay };
});

export default PalmPayModule;
