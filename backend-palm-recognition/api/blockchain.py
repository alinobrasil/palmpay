#!/usr/bin/env python3
"""
Blockchain interaction module for PalmPay
Handles on-chain transactions with the PalmPay smart contract
"""
import os
import json
from web3 import Web3
from eth_account import Account
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Load environment variables
BACKEND_PRIVATE_KEY = os.getenv("BACKEND_PRIVATE_KEY")
RPC_URL = os.getenv("RPC_URL", "https://sepolia.infura.io/v3/YOUR_INFURA_KEY")
PALMPAY_CONTRACT_ADDRESS = os.getenv("PALMPAY_CONTRACT_ADDRESS")
CHAIN_ID = int(os.getenv("CHAIN_ID", "11155111"))  # Sepolia by default

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))

# Load PalmPay contract ABI
ABI_PATH = Path(__file__).parent.parent / "PalmPay_ABI.json"

def load_contract_abi():
    """Load the PalmPay contract ABI from local file"""
    with open(ABI_PATH, 'r') as f:
        artifact = json.load(f)
        # If it's a full artifact, extract the abi field
        if isinstance(artifact, dict) and 'abi' in artifact:
            return artifact['abi']
        # Otherwise assume it's already just the ABI array
        return artifact

# Load ABI and create contract instance
PALMPAY_ABI = load_contract_abi()
palmpay_contract = None

if PALMPAY_CONTRACT_ADDRESS:
    palmpay_contract = w3.eth.contract(
        address=Web3.to_checksum_address(PALMPAY_CONTRACT_ADDRESS),
        abi=PALMPAY_ABI
    )

# Create account from private key
backend_account = None
if BACKEND_PRIVATE_KEY:
    backend_account = Account.from_key(BACKEND_PRIVATE_KEY)


def record_charge(
    customer_address: str,
    store_address: str,
    amount_usd: float,
    nonce: int,
    receipt_hash: bytes
) -> dict:
    """
    Call the PalmPay contract's recordCharge function.

    Args:
        customer_address: Customer's wallet address (identified from palm)
        store_address: Store's wallet address (recipient)
        amount_usd: Amount in USD (will be converted to token units with 6 decimals)
        nonce: Customer's current nonce for replay protection
        receipt_hash: Hash of transaction details (bytes32)

    Returns:
        dict with transaction details:
        {
            "transaction_hash": "0x...",
            "block_number": 12345,
            "gas_used": 150000,
            "status": "success"
        }

    Raises:
        ValueError: If configuration is missing or invalid
        Exception: If transaction fails
    """
    # Validate configuration
    if not palmpay_contract:
        raise ValueError("PalmPay contract not initialized. Check PALMPAY_CONTRACT_ADDRESS env var.")

    if not backend_account:
        raise ValueError("Backend account not initialized. Check BACKEND_PRIVATE_KEY env var.")

    if not w3.is_connected():
        raise ValueError("Web3 not connected. Check RPC_URL.")

    # Convert USD amount to token units (6 decimals for pyUSD)
    amount_in_token_units = int(amount_usd * 10**6)

    # Convert addresses to checksum format
    customer_address = Web3.to_checksum_address(customer_address)
    store_address = Web3.to_checksum_address(store_address)

    # Prepare transaction
    try:
        # Build transaction
        transaction = palmpay_contract.functions.recordCharge(
            customer_address,
            store_address,
            amount_in_token_units,
            nonce,
            receipt_hash
        ).build_transaction({
            'from': backend_account.address,
            'nonce': w3.eth.get_transaction_count(backend_account.address),
            'gas': 0,  # Will be estimated
            'gasPrice': w3.eth.gas_price,
            'chainId': CHAIN_ID
        })

        # Estimate gas or use manual limit
        try:
            gas_estimate = w3.eth.estimate_gas(transaction)
            transaction['gas'] = int(gas_estimate * 1.2)  # Add 20% buffer
            print(f"Gas estimated: {gas_estimate}")
        except Exception as gas_error:
            # Try to get the revert reason by calling the function
            print(f"⚠️  Gas estimation failed. Attempting to get revert reason...")
            try:
                result = palmpay_contract.functions.recordCharge(
                    customer_address,
                    store_address,
                    amount_in_token_units,
                    nonce,
                    receipt_hash
                ).call({'from': backend_account.address})
                print(f"Call succeeded with result: {result}")
                print(f"But gas estimation failed. Using manual gas limit of 500000")
                transaction['gas'] = 500000
            except Exception as revert_error:
                error_message = str(revert_error)
                print(f"❌ Transaction will revert!")
                print(f"   Revert reason: {error_message}")

                # Parse common revert reasons
                if "Customer not active" in error_message:
                    raise Exception("Customer not registered in PalmPay contract. Call registerCustomer() first.") from gas_error
                elif "Store not active" in error_message:
                    raise Exception("Store not registered in PalmPay contract. Call registerStore() first.") from gas_error
                elif "Invalid nonce" in error_message:
                    raise Exception(f"Invalid nonce. Expected {nonce}, but contract has different value.") from gas_error
                elif "Exceeds transaction limit" in error_message:
                    raise Exception(f"Amount ${amount_usd} exceeds customer's transaction limit.") from gas_error
                elif "Token transfer failed" in error_message:
                    raise Exception("Token transfer failed. Check customer has approved PalmPay contract and has sufficient balance.") from gas_error
                elif "Only backend verifier" in error_message:
                    raise Exception("Only backend verifier can call this function. Check BACKEND_PRIVATE_KEY matches contract's backendVerifier.") from gas_error
                else:
                    raise Exception(f"Transaction will revert: {error_message}") from gas_error

        # Sign transaction
        signed_txn = backend_account.sign_transaction(transaction)

        # Send transaction
        tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)

        print(f"Transaction sent: {tx_hash.hex()}")

        # Wait for transaction receipt
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        # Check if transaction was successful
        if tx_receipt['status'] != 1:
            raise Exception(f"Transaction failed. Receipt: {tx_receipt}")

        return {
            "transaction_hash": tx_hash.hex(),
            "block_number": tx_receipt['blockNumber'],
            "gas_used": tx_receipt['gasUsed'],
            "status": "success"
        }

    except Exception as e:
        print(f"Error in record_charge: {e}")
        raise


def get_customer_nonce(customer_address: str) -> int:
    """
    Get the current nonce for a customer from the PalmPay contract.

    Args:
        customer_address: Customer's wallet address

    Returns:
        Current nonce value
    """
    if not palmpay_contract:
        raise ValueError("PalmPay contract not initialized")

    customer_address = Web3.to_checksum_address(customer_address)
    nonce = palmpay_contract.functions.customerNonce(customer_address).call()
    return nonce


def is_initialized() -> bool:
    """Check if blockchain module is properly initialized"""
    return (
        palmpay_contract is not None and
        backend_account is not None and
        w3.is_connected()
    )


def get_status() -> dict:
    """Get blockchain connection status"""
    return {
        "connected": w3.is_connected(),
        "contract_initialized": palmpay_contract is not None,
        "backend_account_configured": backend_account is not None,
        "backend_address": backend_account.address if backend_account else None,
        "chain_id": CHAIN_ID,
        "rpc_url": RPC_URL[:50] + "..." if len(RPC_URL) > 50 else RPC_URL
    }
