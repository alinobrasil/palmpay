#!/usr/bin/env python3
"""
Simple Flask server for palmprint identification
Reads registered palmprints from a folder and compares new images against them
"""
from flask import Flask, request, jsonify
from eth_account.messages import encode_defunct
from eth_account import Account
import edcc
import os
import tempfile
from pathlib import Path
from typing import Dict, List

app = Flask(__name__)

# Configuration
REGISTERED_PALMS_DIR = os.getenv("REGISTERED_PALMS_DIR", "/app/registered_palms")
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.50"))

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
        # Encode the uploaded palmprint
        query_code = encoder.encode_using_file(tmp_path)

        # Compare against all registered palmprints
        best_match_wallet = None
        best_score = 0.0
        all_scores = {}

        for wallet_address, codes in registered_codes.items():
            wallet_scores = []
            for code in codes:
                score = query_code.compare_to(code)
                wallet_scores.append(score)

            # Use the highest score for this wallet
            max_score = max(wallet_scores)
            all_scores[wallet_address] = max_score

            if max_score > best_score:
                best_score = max_score
                best_match_wallet = wallet_address

        # Check if best match exceeds threshold
        match_found = best_score >= SIMILARITY_THRESHOLD

        return jsonify({
            "match_found": match_found,
            "wallet_address": best_match_wallet if match_found else None,
            "similarity_score": best_score,
            "threshold": SIMILARITY_THRESHOLD,
            "all_scores": all_scores  # For debugging/testing
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
