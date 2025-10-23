/**
 * Wallet Authentication for Palm Recognition API
 *
 * This module handles Ethereum wallet signature-based authentication
 * for registering and identifying palmprints.
 *
 * Requirements:
 * - ethers.js v6 (npm install ethers)
 * - User must have MetaMask or similar Web3 wallet installed
 */

import { ethers } from 'ethers';

// API base URL - adjust based on your deployment
const API_BASE_URL = 'http://localhost:8000';

/**
 * Connect to user's wallet and get signer
 * @returns {Promise<ethers.Signer>}
 */
async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('Please install MetaMask or another Web3 wallet');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  return signer;
}

/**
 * Register a palmprint with signature verification
 *
 * @param {File} palmImageFile - The palm image file to register
 * @returns {Promise<Object>} Registration response from API
 */
async function registerPalm(palmImageFile) {
  try {
    // 1. Connect wallet and get signer
    const signer = await connectWallet();

    // 2. Get wallet address
    const address = await signer.getAddress();

    // 3. Create message to sign (includes timestamp to prevent replay attacks)
    const timestamp = Date.now();
    const message = `Register palmprint for ${address}\nTimestamp: ${timestamp}`;

    // 4. User signs message (wallet popup appears here)
    console.log('Requesting signature from wallet...');
    const signature = await signer.signMessage(message);

    // 5. Prepare form data
    const formData = new FormData();
    formData.append('wallet_address', address);
    formData.append('message', message);
    formData.append('signature', signature);
    formData.append('palm_image', palmImageFile);

    // 6. Send to API
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    const result = await response.json();
    console.log('Palm registered successfully:', result);
    return result;

  } catch (error) {
    console.error('Error registering palm:', error);
    throw error;
  }
}

/**
 * Identify a palmprint with signature verification
 *
 * @param {File} palmImageFile - The palm image file to identify
 * @returns {Promise<Object>} Identification response from API
 */
async function identifyPalm(palmImageFile) {
  try {
    // 1. Connect wallet and get signer
    const signer = await connectWallet();

    // 2. Get wallet address
    const address = await signer.getAddress();

    // 3. Create message to sign
    const timestamp = Date.now();
    const message = `Identify palmprint\nTimestamp: ${timestamp}`;

    // 4. User signs message
    console.log('Requesting signature from wallet...');
    const signature = await signer.signMessage(message);

    // 5. Prepare form data
    const formData = new FormData();
    formData.append('message', message);
    formData.append('signature', signature);
    formData.append('palm_image', palmImageFile);

    // 6. Send to API
    const response = await fetch(`${API_BASE_URL}/identify`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Identification failed');
    }

    const result = await response.json();
    console.log('Identification result:', result);
    return result;

  } catch (error) {
    console.error('Error identifying palm:', error);
    throw error;
  }
}

/**
 * Example UI integration
 */
export function setupPalmRegistration() {
  // Example: Register palm button
  const registerBtn = document.getElementById('register-palm-btn');
  const palmInput = document.getElementById('palm-image-input');

  registerBtn?.addEventListener('click', async () => {
    const file = palmInput.files[0];
    if (!file) {
      alert('Please select a palm image');
      return;
    }

    try {
      registerBtn.disabled = true;
      registerBtn.textContent = 'Connecting wallet...';

      const result = await registerPalm(file);

      alert(`Palm registered successfully!\nWallet: ${result.wallet_address}\nTotal palms: ${result.total_palms_for_wallet}`);

    } catch (error) {
      alert(`Registration failed: ${error.message}`);
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = 'Register Palm';
    }
  });
}

/**
 * Example UI integration for identification
 */
export function setupPalmIdentification() {
  // Example: Identify palm button
  const identifyBtn = document.getElementById('identify-palm-btn');
  const palmInput = document.getElementById('palm-image-input');

  identifyBtn?.addEventListener('click', async () => {
    const file = palmInput.files[0];
    if (!file) {
      alert('Please select a palm image');
      return;
    }

    try {
      identifyBtn.disabled = true;
      identifyBtn.textContent = 'Identifying...';

      const result = await identifyPalm(file);

      if (result.match_found) {
        alert(`Match found!\nWallet: ${result.wallet_address}\nSimilarity: ${(result.similarity_score * 100).toFixed(2)}%`);
      } else {
        alert(`No match found.\nBest score: ${(result.similarity_score * 100).toFixed(2)}%`);
      }

    } catch (error) {
      alert(`Identification failed: ${error.message}`);
    } finally {
      identifyBtn.disabled = false;
      identifyBtn.textContent = 'Identify Palm';
    }
  });
}

// Export functions for use in your app
export { connectWallet, registerPalm, identifyPalm };
