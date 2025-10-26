import { network } from "hardhat";
import assert from "assert";

// pyUSD contract address on Ethereum mainnet
const PYUSD_ADDRESS = "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8";

// pyUSD whale address
const PYUSD_WHALE = "0x2fb074FA59c9294c71246825C1c9A0c7782d41a4";

// Minimal ERC20 ABI
const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)"
];

describe("PalmPay", function () {
  let palmPay: any;
  let pyUSD: any;
  let owner: any;
  let customer: any;
  let store: any;
  let backendVerifier: any;
  let ethers: any;

  before(async function () {
    const connection = await network.connect();
    ethers = connection.ethers;

    // Check if pyUSD contract exists
    const code = await ethers.provider.getCode(PYUSD_ADDRESS);
    if (code === '0x') {
      throw new Error(`No contract found at pyUSD address ${PYUSD_ADDRESS}.`);
    }

    // Get signers
    [owner, customer, store, backendVerifier] = await ethers.getSigners();

    // Get pyUSD contract instance
    pyUSD = new ethers.Contract(PYUSD_ADDRESS, ERC20_ABI, ethers.provider);

    // Deploy PalmPay contract ONCE
    const PalmPayFactory = await ethers.getContractFactory("PalmPay");
    palmPay = await PalmPayFactory.deploy(PYUSD_ADDRESS, backendVerifier.address);

    // Impersonate whale
    const whaleAddress = ethers.getAddress(PYUSD_WHALE);
    await ethers.provider.send("hardhat_impersonateAccount", [whaleAddress]);
    const whale = await ethers.getSigner(whaleAddress);

    // Fund whale with ETH
    await owner.sendTransaction({ to: whaleAddress, value: ethers.parseEther("10") });

    // Transfer pyUSD to customer
    const amount = ethers.parseUnits("10000", 6);
    await pyUSD.connect(whale).transfer(customer.address, amount);

    console.log("✓ Setup complete");
  });

  describe("Deployment", function () {
    it("should set the correct payment token", async function () {
      const token = await palmPay.paymentToken();
      assert.strictEqual(token, PYUSD_ADDRESS);
    });

    it("should set the correct backend verifier", async function () {
      const verifier = await palmPay.backendVerifier();
      assert.strictEqual(verifier, backendVerifier.address);
    });

    it("should set max spending limit to 200 pyUSD", async function () {
      const ceiling = await palmPay.maxSpendingLimitCeiling();
      assert.strictEqual(ceiling, ethers.parseUnits("200", 6));
    });
  });

  describe("Customer Registration", function () {
    it("should allow customer to register", async function () {
      await palmPay.connect(customer).registerCustomer();

      const settings = await palmPay.getCustomerSettings(customer.address);
      assert.strictEqual(settings.active, true);
    });

  });

  describe("Store Registration", function () {
    it("should allow store to register", async function () {
      await palmPay.connect(store).registerStore("Test Store", "Test City");

      const info = await palmPay.getStoreInfo(store.address);
      assert.strictEqual(info.active, true);
      assert.strictEqual(info.name, "Test Store");
      assert.strictEqual(info.city, "Test City");
    });

    it("should not allow store to register twice", async function () {
      await assert.rejects(
        async () => await palmPay.connect(store).registerStore("Another", "Another")
      );
    });
  });

  describe("recordCharge", function () {
    it("should successfully record a charge", async function () {
      const chargeAmount = ethers.parseUnits("10", 6);
      await pyUSD.connect(customer).approve(await palmPay.getAddress(), chargeAmount);

      const nonce = await palmPay.customerNonce(customer.address);
      const receiptHash = ethers.keccak256(ethers.toUtf8Bytes("receipt-123"));

      const storeBalanceBefore = await pyUSD.balanceOf(store.address);

      await palmPay.connect(backendVerifier).recordCharge(
        customer.address,
        store.address,
        chargeAmount,
        nonce,
        receiptHash
      );

      const storeBalanceAfter = await pyUSD.balanceOf(store.address);
      assert.strictEqual(storeBalanceAfter, storeBalanceBefore + chargeAmount);

      const newNonce = await palmPay.customerNonce(customer.address);
      assert.strictEqual(newNonce, nonce + 1n);
    });

    it("should fail if not called by backend verifier", async function () {
      const chargeAmount = ethers.parseUnits("10", 6);
      await pyUSD.connect(customer).approve(await palmPay.getAddress(), chargeAmount);

      const nonce = await palmPay.customerNonce(customer.address);
      const receiptHash = ethers.keccak256(ethers.toUtf8Bytes("receipt-fail"));

      await assert.rejects(
        async () => await palmPay.connect(customer).recordCharge(
          customer.address,
          store.address,
          chargeAmount,
          nonce,
          receiptHash
        )
      );
    });

    it("should fail with invalid nonce", async function () {
      const chargeAmount = ethers.parseUnits("10", 6);
      await pyUSD.connect(customer).approve(await palmPay.getAddress(), chargeAmount);

      const wrongNonce = 9999;
      const receiptHash = ethers.keccak256(ethers.toUtf8Bytes("receipt-fail"));

      await assert.rejects(
        async () => await palmPay.connect(backendVerifier).recordCharge(
          customer.address,
          store.address,
          chargeAmount,
          wrongNonce,
          receiptHash
        )
      );
    });

    it("should fail if amount exceeds limit", async function () {
      const chargeAmount = ethers.parseUnits("201", 6);
      await pyUSD.connect(customer).approve(await palmPay.getAddress(), chargeAmount);

      const nonce = await palmPay.customerNonce(customer.address);
      const receiptHash = ethers.keccak256(ethers.toUtf8Bytes("receipt-fail"));

      await assert.rejects(
        async () => await palmPay.connect(backendVerifier).recordCharge(
          customer.address,
          store.address,
          chargeAmount,
          nonce,
          receiptHash
        )
      );
    });

    it("should handle multiple charges", async function () {
      const chargeAmount = ethers.parseUnits("5", 6);
      await pyUSD.connect(customer).approve(await palmPay.getAddress(), chargeAmount * 3n);

      const storeBalanceBefore = await pyUSD.balanceOf(store.address);

      for (let i = 0; i < 3; i++) {
        const nonce = await palmPay.customerNonce(customer.address);
        await palmPay.connect(backendVerifier).recordCharge(
          customer.address,
          store.address,
          chargeAmount,
          nonce,
          ethers.keccak256(ethers.toUtf8Bytes(`receipt-${i}`))
        );
      }

      const storeBalanceAfter = await pyUSD.balanceOf(store.address);
      assert.strictEqual(storeBalanceAfter, storeBalanceBefore + (chargeAmount * 3n));
    });
  });
});
