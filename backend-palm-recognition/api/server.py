#!/usr/bin/env python3
"""
Simple Flask server for palmprint identification
Reads registered palmprints from a folder and compares new images against them
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
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
import cv2
import numpy as np

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
REGISTERED_PALMS_DIR = os.getenv("REGISTERED_PALMS_DIR", "./registered_palms")
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.1"))

# Create encoder
config = edcc.EncoderConfig(29, 5, 5, 10)
encoder = edcc.create_encoder(config)

# Cache for encoded registered palmprints
# Format: { "wallet_address": [code1, code2, ...] }
registered_codes: Dict[str, List] = {}


def preprocess_palm_image(image_path: str) -> str:
    """
    Preprocess palm image to improve recognition accuracy:
    1. Detect skin region using color thresholding
    2. Find the largest contour (palm)
    3. Crop to palm region with padding
    4. Resize to standard dimensions

    Args:
        image_path: Path to the input palm image

    Returns:
        Path to the preprocessed image (temporary file)
    """
    try:
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            print(f"  ⚠️  Failed to read image, returning original: {image_path}")
            return image_path

        original_height, original_width = img.shape[:2]
        print(f"  📐 Original image size: {original_width}x{original_height}")

        # Convert to HSV for better skin detection
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        # Define skin color range in HSV
        # These values work well for most skin tones
        lower_skin = np.array([0, 20, 70], dtype=np.uint8)
        upper_skin = np.array([20, 255, 255], dtype=np.uint8)

        # Create mask for skin pixels
        mask = cv2.inRange(hsv, lower_skin, upper_skin)

        # Apply morphological operations to clean up the mask
        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)

        # Find contours
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            print(f"  ⚠️  No palm detected, returning original image")
            return image_path

        # Find the largest contour (assumed to be the palm)
        largest_contour = max(contours, key=cv2.contourArea)
        contour_area = cv2.contourArea(largest_contour)

        # Get bounding rectangle
        x, y, w, h = cv2.boundingRect(largest_contour)

        print(f"  ✂️  Detected palm region: x={x}, y={y}, w={w}, h={h}, area={contour_area:.0f}")

        # Add padding around the detected region (20% on each side)
        padding_x = int(w * 0.2)
        padding_y = int(h * 0.2)

        x_start = max(0, x - padding_x)
        y_start = max(0, y - padding_y)
        x_end = min(original_width, x + w + padding_x)
        y_end = min(original_height, y + h + padding_y)

        # Crop to palm region
        cropped = img[y_start:y_end, x_start:x_end]

        if cropped.size == 0:
            print(f"  ⚠️  Cropping failed, returning original image")
            return image_path

        # Resize to standard size (maintaining aspect ratio)
        target_size = 400  # Standard size for palm images
        h_crop, w_crop = cropped.shape[:2]

        if h_crop > w_crop:
            new_h = target_size
            new_w = int((target_size / h_crop) * w_crop)
        else:
            new_w = target_size
            new_h = int((target_size / w_crop) * h_crop)

        resized = cv2.resize(cropped, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)

        print(f"  ✅ Preprocessed to: {new_w}x{new_h}")

        # Save to temporary file
        file_extension = os.path.splitext(image_path)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp:
            cv2.imwrite(tmp.name, resized)
            preprocessed_path = tmp.name

        return preprocessed_path

    except Exception as e:
        print(f"  ⚠️  Error during preprocessing: {e}")
        print(f"  Returning original image")
        return image_path


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
                    # Preprocess the image before encoding
                    print(f"  Processing {image_file.name}...")
                    preprocessed_path = preprocess_palm_image(str(image_file))

                    # Encode the preprocessed image
                    code = encoder.encode_using_file(preprocessed_path)
                    codes.append(code)

                    # Clean up temporary preprocessed file if it's different from original
                    if preprocessed_path != str(image_file) and os.path.exists(preprocessed_path):
                        os.remove(preprocessed_path)

                    print(f"  ✅ Loaded {image_file.name} for wallet {wallet_address}")
                except Exception as e:
                    print(f"  ❌ Error encoding {image_file}: {e}")

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

    # Preprocess and encode the uploaded palmprint
    print(f"  Preprocessing query image: {image_path}")
    preprocessed_path = preprocess_palm_image(image_path)

    print(f"  Encoding preprocessed image...")
    query_code = encoder.encode_using_file(preprocessed_path)
    print(f"  ✅ Query code encoded successfully")

    # Clean up temporary preprocessed file if different from original
    cleanup_preprocessed = (preprocessed_path != image_path and os.path.exists(preprocessed_path))

    # Track best match
    best_score = 0.0
    best_wallet = None

    # Compare against all registered palmprints
    print(f"  Comparing against {len(registered_codes)} registered wallets...")
    for wallet_address, codes in registered_codes.items():
        print(f"    Checking wallet {wallet_address} ({len(codes)} registered palms)")
        for idx, code in enumerate(codes):
            score = query_code.compare_to(code)
            print(f"      Palm {idx+1}: similarity = {score:.4f} {'✓ MATCH!' if score >= SIMILARITY_THRESHOLD else ''}")

            # Track best score
            if score > best_score:
                best_score = score
                best_wallet = wallet_address

            # If we find a match above threshold, return immediately
            if score >= SIMILARITY_THRESHOLD:
                # Clean up before returning
                if cleanup_preprocessed:
                    os.remove(preprocessed_path)
                return (True, wallet_address, score)

    # No match found above threshold
    print(f"  Best match: {best_wallet} with score {best_score:.4f} (threshold: {SIMILARITY_THRESHOLD})")

    # Clean up before returning
    if cleanup_preprocessed:
        os.remove(preprocessed_path)

    return (False, best_wallet, best_score)


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

    # Save and process the uploaded image
    try:
        # Save to temporary location first
        temp_path = str(file_path) + ".tmp"
        palm_image.save(temp_path)

        print(f"  Processing uploaded image for registration...")
        # Preprocess the image
        preprocessed_path = preprocess_palm_image(temp_path)

        # Save the preprocessed image as the final registered image
        if preprocessed_path != temp_path:
            # Move preprocessed to final location
            import shutil
            shutil.move(preprocessed_path, str(file_path))
        else:
            # If preprocessing didn't create a new file, just rename temp
            os.rename(temp_path, str(file_path))

        # Clean up temp file if it still exists
        if os.path.exists(temp_path):
            os.remove(temp_path)

        print(f"  Encoding registered palmprint...")
        # Encode the preprocessed palmprint
        code = encoder.encode_using_file(str(file_path))

        # Update in-memory cache
        if wallet_address not in registered_codes:
            registered_codes[wallet_address] = []
        registered_codes[wallet_address].append(code)

        print(f"  ✅ Successfully registered {filename} for wallet {wallet_address}")

        return jsonify({
            "status": "registered",
            "wallet_address": wallet_address,
            "filename": filename,
            "total_palms_for_wallet": len(registered_codes[wallet_address])
        })

    except Exception as e:
        # Clean up files if encoding failed
        if file_path.exists():
            os.remove(file_path)
        temp_path = str(file_path) + ".tmp"
        if os.path.exists(temp_path):
            os.remove(temp_path)
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


@app.route("/debug_preprocess", methods=["POST"])
def debug_preprocess():
    """
    Debug endpoint to visualize preprocessing results.
    Saves original, mask, and preprocessed images to debug_output folder.

    Example usage:
      curl -X POST -F "palm_image=@test_palm.jpg" http://localhost:8000/debug_preprocess
    """
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
        # Create debug output directory
        debug_dir = Path("./debug_output")
        debug_dir.mkdir(exist_ok=True)

        # Read original image
        img = cv2.imread(tmp_path)
        if img is None:
            return jsonify({"detail": "Failed to read image"}), 400

        original_height, original_width = img.shape[:2]

        # Save original
        original_path = debug_dir / f"1_original{file_extension}"
        cv2.imwrite(str(original_path), img)

        # Convert to HSV and create mask
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        lower_skin = np.array([0, 20, 70], dtype=np.uint8)
        upper_skin = np.array([20, 255, 255], dtype=np.uint8)
        mask = cv2.inRange(hsv, lower_skin, upper_skin)

        # Save mask
        mask_path = debug_dir / f"2_skin_mask{file_extension}"
        cv2.imwrite(str(mask_path), mask)

        # Apply morphological operations
        kernel = np.ones((5, 5), np.uint8)
        mask_cleaned = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
        mask_cleaned = cv2.morphologyEx(mask_cleaned, cv2.MORPH_OPEN, kernel, iterations=1)

        # Save cleaned mask
        mask_cleaned_path = debug_dir / f"3_cleaned_mask{file_extension}"
        cv2.imwrite(str(mask_cleaned_path), mask_cleaned)

        # Find contours
        contours, _ = cv2.findContours(mask_cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return jsonify({
                "detail": "No palm detected",
                "original_size": f"{original_width}x{original_height}",
                "files_saved": [str(original_path), str(mask_path), str(mask_cleaned_path)]
            }), 200

        # Draw all contours on a copy
        img_contours = img.copy()
        cv2.drawContours(img_contours, contours, -1, (0, 255, 0), 3)
        contours_path = debug_dir / f"4_all_contours{file_extension}"
        cv2.imwrite(str(contours_path), img_contours)

        # Find largest contour
        largest_contour = max(contours, key=cv2.contourArea)
        contour_area = cv2.contourArea(largest_contour)
        x, y, w, h = cv2.boundingRect(largest_contour)

        # Draw bounding box on original
        img_bbox = img.copy()
        cv2.rectangle(img_bbox, (x, y), (x+w, y+h), (0, 0, 255), 3)
        bbox_path = debug_dir / f"5_bounding_box{file_extension}"
        cv2.imwrite(str(bbox_path), img_bbox)

        # Add padding
        padding_x = int(w * 0.2)
        padding_y = int(h * 0.2)
        x_start = max(0, x - padding_x)
        y_start = max(0, y - padding_y)
        x_end = min(original_width, x + w + padding_x)
        y_end = min(original_height, y + h + padding_y)

        # Show padded region
        img_padded = img.copy()
        cv2.rectangle(img_padded, (x_start, y_start), (x_end, y_end), (255, 0, 0), 3)
        padded_path = debug_dir / f"6_padded_region{file_extension}"
        cv2.imwrite(str(padded_path), img_padded)

        # Crop and resize
        cropped = img[y_start:y_end, x_start:x_end]
        target_size = 400
        h_crop, w_crop = cropped.shape[:2]

        if h_crop > w_crop:
            new_h = target_size
            new_w = int((target_size / h_crop) * w_crop)
        else:
            new_w = target_size
            new_h = int((target_size / w_crop) * h_crop)

        resized = cv2.resize(cropped, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)

        # Save final preprocessed image
        preprocessed_path = debug_dir / f"7_preprocessed{file_extension}"
        cv2.imwrite(str(preprocessed_path), resized)

        return jsonify({
            "status": "success",
            "original_size": f"{original_width}x{original_height}",
            "detected_region": {
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h),
                "area": int(contour_area)
            },
            "padded_region": {
                "x_start": int(x_start),
                "y_start": int(y_start),
                "x_end": int(x_end),
                "y_end": int(y_end)
            },
            "final_size": f"{new_w}x{new_h}",
            "files_saved": {
                "1_original": str(original_path),
                "2_skin_mask": str(mask_path),
                "3_cleaned_mask": str(mask_cleaned_path),
                "4_all_contours": str(contours_path),
                "5_bounding_box": str(bbox_path),
                "6_padded_region": str(padded_path),
                "7_preprocessed": str(preprocessed_path)
            },
            "note": "Check the debug_output folder to see all stages of preprocessing"
        })

    except Exception as e:
        return jsonify({"detail": f"Error during debug preprocessing: {str(e)}"}), 500

    finally:
        # Clean up temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


if __name__ == "__main__":
    # Load registered palmprints on startup
    print("Loading registered palmprints...")
    load_registered_palmprints()

    # Run Flask development server
    print("Starting Palm Recognition API server on http://0.0.0.0:8000")
    app.run(host="0.0.0.0", port=8000, debug=True)
