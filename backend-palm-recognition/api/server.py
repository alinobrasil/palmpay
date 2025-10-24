#!/usr/bin/env python3
"""
Simple Flask server for palmprint identification
Reads registered palmprints from a folder and compares new images against them
"""
from flask import Flask, request, jsonify
from eth_account.messages import encode_defunct
from eth_account import Account
from dotenv import load_dotenv
import edcc
import os
import tempfile
import hashlib
from pathlib import Path
from typing import Dict, List
import blockchain

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Configuration
REGISTERED_PALMS_DIR = os.getenv("REGISTERED_PALMS_DIR", "./registered_palms")
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.15"))

# Create encoder
config = edcc.EncoderConfig(29, 5, 5, 10)
encoder = edcc.create_encoder(config)

# Cache for encoded registered palmprints
# Format: { "wallet_address": [code1, code2, ...] }
registered_codes: Dict[str, List] = {}


def verify_signature(message: str, signature: str, claimed_address: str) -> bool:
    """
    Verify that the signature was created by the claimed wallet address.

    Args:
        message: The original message that was signed
        signature: The signature created by the user's wallet
        claimed_address: The wallet address claiming to have signed the message

    Returns:
        True if signature is valid and matches claimed address, False otherwise
    """
    try:
        # Encode the message using Ethereum's signed message standard
        message_hash = encode_defunct(text=message)

        # Recover the address from the signature
        recovered_address = Account.recover_message(message_hash, signature=signature)

        # Check if recovered address matches claimed address (case-insensitive)
        return recovered_address.lower() == claimed_address.lower()
    except Exception as e:
        print(f"Signature verification error: {e}")
        return False


def load_registered_palmprints():
    """
    Load and encode all palmprints from the registered_palms directory.
    Directory structure:
      registered_palms/
        0x123abc.../
          palm1.jpg
          palm2.jpg
        0x456def.../
          palm1.jpg
    """
    global registered_codes
    registered_codes = {}

    if not os.path.exists(REGISTERED_PALMS_DIR):
        os.makedirs(REGISTERED_PALMS_DIR)
        print(f"Created {REGISTERED_PALMS_DIR} directory")
        return

    for wallet_dir in Path(REGISTERED_PALMS_DIR).iterdir():
        if not wallet_dir.is_dir():
            continue

        wallet_address = wallet_dir.name
        codes = []

        for image_file in wallet_dir.iterdir():
            if image_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp']:
                try:
                    code = encoder.encode_using_file(str(image_file))
                    codes.append(code)
                    print(f"Loaded {image_file.name} for wallet {wallet_address}")
                except Exception as e:
                    print(f"Error encoding {image_file}: {e}")

        if codes:
            registered_codes[wallet_address] = codes

    print(f"Loaded {len(registered_codes)} registered wallets with {sum(len(c) for c in registered_codes.values())} total palmprints")


def identify_palm(image_path: str) -> tuple[bool, str | None, float]:
    """
    Identify a palmprint by comparing against all registered palmprints.

    Args:
        image_path: Path to the palm image file to identify

    Returns:
        Tuple of (match_found, wallet_address, similarity_score)
        - match_found: True if a match above threshold was found
        - wallet_address: The matched wallet address or None
        - similarity_score: The best similarity score found
    """
    if not registered_codes:
        raise ValueError("No registered palmprints available")

    # Encode the uploaded palmprint
    query_code = encoder.encode_using_file(image_path)

    # Compare against all registered palmprints
    # Return immediately when a match above threshold is found
    for wallet_address, codes in registered_codes.items():
        for code in codes:
            score = query_code.compare_to(code)

            # If we find a match above threshold, return immediately
            if score >= SIMILARITY_THRESHOLD:
                return (True, wallet_address, score)

    # No match found above threshold
    return (False, None, 0.0)


@app.route("/", methods=["GET"])
def root():
    """Health check"""
    return jsonify({
        "status": "running",
        "registered_wallets": len(registered_codes),
        "total_palmprints": sum(len(codes) for codes in registered_codes.values()),
        "similarity_threshold": SIMILARITY_THRESHOLD
    })


@app.route("/identify", methods=["POST"])
def identify_palmprint():
    """
    Identify a palmprint by comparing against all registered palmprints.

    Returns the wallet address if a match is found above threshold, otherwise null.

    Example usage:
      curl -X POST -F "palm_image=@test_palm.jpg" http://localhost:8000/identify
    """
    if not registered_codes:
        return jsonify({"detail": "No registered palmprints found"}), 503

    # Get uploaded file
    if 'palm_image' not in request.files:
        return jsonify({"detail": "palm_image file is required"}), 400

    palm_image = request.files['palm_image']
    if palm_image.filename == '':
        return jsonify({"detail": "No file selected"}), 400

    # Save uploaded file temporarily
    file_extension = os.path.splitext(palm_image.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp:
        palm_image.save(tmp.name)
        tmp_path = tmp.name

    try:
        # Call the identification function
        match_found, wallet_address, similarity_score = identify_palm(tmp_path)

        return jsonify({
            "match_found": match_found,
            "wallet_address": wallet_address,
            "similarity_score": similarity_score,
            "threshold": SIMILARITY_THRESHOLD
        })

    except Exception as e:
        return jsonify({"detail": f"Error processing palmprint: {str(e)}"}), 500

    finally:
        # Clean up temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.route("/register", methods=["POST"])
def register_palmprint():
    """
    Register a new palmprint for a wallet address.
    Optional signature verification to prove ownership of the wallet.

    Creates a directory for the wallet if it doesn't exist and saves the palm image.
    The image is encoded and added to the in-memory cache.

    Example usage (with signature):
      curl -X POST \
        -F "wallet_address=0x123abc" \
        -F "message=Register palmprint for 0x123abc\\nTimestamp: 1234567890" \
        -F "signature=0x..." \
        -F "palm_image=@my_palm.jpg" \
        http://localhost:8000/register

    Example usage (without signature, for testing):
      curl -X POST \
        -F "wallet_address=0x123abc" \
        -F "palm_image=@my_palm.jpg" \
        http://localhost:8000/register
    """
    # Get wallet address from form data
    wallet_address = request.form.get('wallet_address')
    if not wallet_address or not wallet_address.strip():
        return jsonify({"detail": "Wallet address is required"}), 400

    # Get optional signature fields
    message = request.form.get('message')
    signature = request.form.get('signature')

    # Verify signature if provided
    if message and signature:
        if not verify_signature(message, signature, wallet_address):
            return jsonify({
                "detail": "Signature verification failed. You must prove ownership of this wallet address."
            }), 401

    # Get uploaded file
    if 'palm_image' not in request.files:
        return jsonify({"detail": "palm_image file is required"}), 400

    palm_image = request.files['palm_image']
    if palm_image.filename == '':
        return jsonify({"detail": "No file selected"}), 400

    # Create wallet directory if it doesn't exist
    wallet_dir = Path(REGISTERED_PALMS_DIR) / wallet_address
    wallet_dir.mkdir(parents=True, exist_ok=True)

    # Generate filename based on existing count
    existing_images = list(wallet_dir.glob("palm*.jpg")) + list(wallet_dir.glob("palm*.png"))
    next_number = len(existing_images) + 1
    file_extension = os.path.splitext(palm_image.filename)[1] or '.jpg'
    filename = f"palm{next_number}{file_extension}"
    file_path = wallet_dir / filename

    # Save the uploaded image
    try:
        palm_image.save(str(file_path))

        # Encode the new palmprint
        code = encoder.encode_using_file(str(file_path))

        # Update in-memory cache
        if wallet_address not in registered_codes:
            registered_codes[wallet_address] = []
        registered_codes[wallet_address].append(code)

        return jsonify({
            "status": "registered",
            "wallet_address": wallet_address,
            "filename": filename,
            "total_palms_for_wallet": len(registered_codes[wallet_address])
        })

    except Exception as e:
        # Clean up the file if encoding failed
        if file_path.exists():
            os.remove(file_path)
        return jsonify({"detail": f"Error registering palmprint: {str(e)}"}), 500


@app.route("/scanned_palm", methods=["POST"])
def scanned_palm():
    """
    Process palm scan for payment.

    1. Identifies customer from palm scan
    2. Calls PalmPay smart contract to execute payment from customer to store

    Required form data:
      - palm_image: The palm image file to identify
      - amount_usd: Amount in USD to charge
      - store_address: Store's wallet address (recipient)

    Returns:
      - Success: Transaction details including tx hash
      - Failure: Error message

    Example usage:
      curl -X POST \
        -F "palm_image=@customer_palm.jpg" \
        -F "amount_usd=25.50" \
        -F "store_address=0x123abc..." \
        http://localhost:8000/scanned_palm
    """
    # Check if blockchain is initialized
    if not blockchain.is_initialized():
        return jsonify({
            "detail": "Blockchain not initialized. Check environment variables.",
            "blockchain_status": blockchain.get_status()
        }), 503

    # Get form data
    print("\n" + "="*80)
    print("📸 /scanned_palm endpoint called")
    print("="*80)

    if 'palm_image' not in request.files:
        return jsonify({"detail": "palm_image file is required"}), 400

    palm_image = request.files['palm_image']
    if palm_image.filename == '':
        return jsonify({"detail": "No file selected"}), 400

    print(f"✓ Palm image received: {palm_image.filename}")

    amount_usd = request.form.get('amount_usd')
    if not amount_usd:
        return jsonify({"detail": "amount_usd is required"}), 400

    try:
        amount_usd = float(amount_usd)
        if amount_usd <= 0:
            return jsonify({"detail": "amount_usd must be greater than 0"}), 400
    except ValueError:
        return jsonify({"detail": "amount_usd must be a valid number"}), 400

    store_address = request.form.get('store_address')
    if not store_address or not store_address.strip():
        return jsonify({"detail": "store_address is required"}), 400

    print(f"✓ Amount USD: ${amount_usd}")
    print(f"✓ Store Address: {store_address}")

    # Save uploaded file temporarily
    file_extension = os.path.splitext(palm_image.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp:
        palm_image.save(tmp.name)
        tmp_path = tmp.name

    try:
        # Step 1: Identify customer from palm scan
        print("\n🔍 Step 1: Identifying customer from palm scan...")
        match_found, customer_address, similarity_score = identify_palm(tmp_path)

        if not match_found:
            print(f"❌ No match found. Similarity score: {similarity_score}")
            return jsonify({
                "success": False,
                "detail": "Palm not recognized. No matching customer found.",
                "similarity_score": similarity_score
            }), 404

        print(f"✓ Customer identified: {customer_address}")
        print(f"  Similarity score: {similarity_score}")

        # Step 2: Get customer's current nonce from contract
        print("\n🔗 Step 2: Getting customer nonce from smart contract...")
        customer_nonce = blockchain.get_customer_nonce(customer_address)
        print(f"✓ Customer nonce: {customer_nonce}")

        # Step 3: Generate receipt hash (for audit trail)
        import time
        timestamp = int(time.time())
        receipt_data = f"{customer_address}{store_address}{amount_usd}{customer_nonce}{timestamp}"
        receipt_hash = hashlib.sha256(receipt_data.encode()).digest()
        print(f"\n📝 Step 3: Generated receipt hash")
        print(f"  Receipt hash: {receipt_hash.hex()[:16]}...")

        # Step 4: Call smart contract to record charge and transfer tokens
        print(f"\n💳 Step 4: Calling smart contract to record charge...")
        print(f"  Parameters:")
        print(f"    Customer:    {customer_address}")
        print(f"    Store:       {store_address}")
        print(f"    Amount USD:  ${amount_usd}")
        print(f"    Amount (6 decimals): {int(amount_usd * 1e6)}")
        print(f"    Nonce:       {customer_nonce}")
        print(f"    Receipt:     {receipt_hash.hex()}")

        tx_result = blockchain.record_charge(
            customer_address=customer_address,
            store_address=store_address,
            amount_usd=amount_usd,
            nonce=customer_nonce,
            receipt_hash=receipt_hash
        )

        print(f"✓ Transaction successful!")
        print(f"  TX Hash: {tx_result['transaction_hash']}")
        print(f"  Block:   {tx_result['block_number']}")
        print(f"  Gas:     {tx_result['gas_used']}")
        print("="*80 + "\n")

        return jsonify({
            "success": True,
            "customer_address": customer_address,
            "store_address": store_address,
            "amount_usd": amount_usd,
            "similarity_score": similarity_score,
            "transaction_hash": tx_result['transaction_hash'],
            "block_number": tx_result['block_number'],
            "gas_used": tx_result['gas_used'],
            "nonce_used": customer_nonce
        })

    except ValueError as e:
        print(f"\n❌ Configuration error: {str(e)}")
        print("="*80 + "\n")
        return jsonify({"detail": f"Configuration error: {str(e)}"}), 500

    except Exception as e:
        print(f"\n❌ Error processing scanned palm:")
        print(f"   Error type: {type(e).__name__}")
        print(f"   Error message: {str(e)}")
        import traceback
        print(f"   Traceback:")
        traceback.print_exc()
        print("="*80 + "\n")
        return jsonify({"detail": f"Error processing payment: {str(e)}"}), 500

    finally:
        # Clean up temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.route("/reload", methods=["POST"])
def reload_palmprints():
    """
    Reload registered palmprints from disk.
    Use this after manually adding new palmprints to the folder.

    Example usage:
      curl -X POST http://localhost:8000/reload
    """
    load_registered_palmprints()
    return jsonify({
        "status": "reloaded",
        "registered_wallets": len(registered_codes),
        "total_palmprints": sum(len(codes) for codes in registered_codes.values())
    })


if __name__ == "__main__":
    # Load registered palmprints on startup
    print("Loading registered palmprints...")
    load_registered_palmprints()

    # Run Flask development server
    print("Starting Palm Recognition API server on http://0.0.0.0:8000")
    app.run(host="0.0.0.0", port=8000, debug=True)
