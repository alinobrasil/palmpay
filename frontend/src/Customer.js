import React, { useState } from 'react';
import { ethers } from 'ethers';

// Placeholder addresses - update these later
const TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';
const SPENDER_ADDRESS = '0x0000000000000000000000000000000000000000';

// Placeholder API URL - update this later
const API_BASE_URL = 'http://localhost:8000';

// ERC20 Token ABI (only approve function)
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) public returns (bool)'
];

function Customer({ walletAddress, signer }) {
  const [palmImage, setPalmImage] = useState(null);
  const [allowanceAmount, setAllowanceAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPalmImage(e.target.files[0]);
    }
  };

  const registerPalm = async () => {
    if (!palmImage) {
      alert('Please select a palm image first');
      return;
    }

    setLoading(true);

    try {
      // Create message to sign
      const timestamp = Date.now();
      const message = `Register palmprint for ${walletAddress}\nTimestamp: ${timestamp}`;

      // Sign the message
      const signature = await signer.signMessage(message);

      // Prepare form data
      const formData = new FormData();
      formData.append('wallet_address', walletAddress);
      formData.append('message', message);
      formData.append('signature', signature);
      formData.append('palm_image', palmImage);

      // Call API
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      const result = await response.json();
      alert(`Palm registered successfully!\nFilename: ${result.filename}\nTotal palms: ${result.total_palms_for_wallet}`);
      setPalmImage(null);

    } catch (error) {
      console.error('Error registering palm:', error);
      alert(`Failed to register palm: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const setAllowance = async () => {
    if (!allowanceAmount || allowanceAmount <= 0) {
      alert('Please enter a valid allowance amount');
      return;
    }

    setLoading(true);

    try {
      // Create token contract instance
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer);

      // Convert amount to token units (assuming 18 decimals)
      const amount = ethers.parseUnits(allowanceAmount, 18);

      // Call approve function
      const tx = await tokenContract.approve(SPENDER_ADDRESS, amount);
      alert('Transaction submitted! Waiting for confirmation...');

      // Wait for transaction to be mined
      await tx.wait();

      alert(`Allowance set successfully!\nAmount: ${allowanceAmount}\nTransaction: ${tx.hash}`);
      setAllowanceAmount('');

    } catch (error) {
      console.error('Error setting allowance:', error);
      alert(`Failed to set allowance: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-view">
      <h2>Customer Panel</h2>

      <div className="section">
        <h3>Register Palm</h3>
        <div className="form-group">
          <label>Select Palm Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={loading}
          />
          {palmImage && (
            <p className="file-info">Selected: {palmImage.name}</p>
          )}
        </div>
        <button
          onClick={registerPalm}
          disabled={loading || !palmImage}
          className="btn-primary"
        >
          {loading ? 'Processing...' : 'Register Palm'}
        </button>
      </div>

      <div className="section">
        <h3>Set Allowance</h3>
        <div className="form-group">
          <label>Allowance Amount (tokens):</label>
          <input
            type="number"
            value={allowanceAmount}
            onChange={(e) => setAllowanceAmount(e.target.value)}
            placeholder="Enter amount"
            disabled={loading}
            min="0"
            step="0.01"
          />
        </div>
        <button
          onClick={setAllowance}
          disabled={loading || !allowanceAmount}
          className="btn-primary"
        >
          {loading ? 'Processing...' : 'Set Allowance'}
        </button>
        <p className="info-text">
          Token: {TOKEN_ADDRESS}<br />
          Spender: {SPENDER_ADDRESS}
        </p>
      </div>
    </div>
  );
}

export default Customer;
