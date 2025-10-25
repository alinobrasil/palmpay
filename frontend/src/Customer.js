import React, { useState } from 'react';
import { useAccount, useSignMessage, useContractWrite, useContractRead } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import './Customer.css';

// Placeholder addresses - update these later
const TOKEN_ADDRESS = '0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9';
const SPENDER_ADDRESS = '0xcBDF0548025C208bAB08831E43514B6F1693F8c5';

// Placeholder API URL - update this later
const API_BASE_URL = 'http://192.168.50.158:8000';

// ERC20 Token ABI (only approve function)
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

function Customer() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [palmImage, setPalmImage] = useState(null);
  const [allowanceAmount, setAllowanceAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const { data: currentAllowance } = useContractRead({
    address: TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address, SPENDER_ADDRESS],
    watch: true,
  });

  const { write: approveTokens } = useContractWrite({
    address: TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'approve',
  });

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPalmImage(e.target.files[0]);
    }
  };

  const registerPalm = async () => {
    if (!palmImage || !address) {
      alert('Please select a palm image and connect your wallet first');
      return;
    }

    setLoading(true);
    console.log('Starting palm registration...');
    console.log('Wallet address:', address);
    console.log('Palm image:', palmImage);

    try {
      const timestamp = Date.now().toString();
      const messageToSign = `Register palmprint:${address.toLowerCase()}:${timestamp}`;
      console.log('About to sign message:', messageToSign);

      const signature = await signMessageAsync({
        message: messageToSign,
      });
      console.log('Received signature:', signature);

      const formData = new FormData();
      formData.append('wallet_address', address.toLowerCase());
      formData.append('message', messageToSign);
      formData.append('signature', signature);
      formData.append('palm_image', palmImage);

      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0], ':', typeof pair[1], pair[1]);
      }

      const endpoint = `${API_BASE_URL}/register`;
      console.log('Sending request to:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors', // Changed from 'no-cors' to 'cors'
        credentials: 'omit', // Changed from 'include' to 'omit'
      });

      console.log('Raw response:', response);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!response.ok) {
        console.error('Error response:', responseText);
        throw new Error(responseText || 'Registration failed');
      }

      const result = responseText ? JSON.parse(responseText) : {};
      console.log('Parsed result:', result);

      alert(`Palm registered successfully!\nFilename: ${result.filename || 'unknown'}\nTotal palms: ${result.total_palms_for_wallet || 0}`);
      setPalmImage(null);

    } catch (error) {
      console.error('Error registering palm:', error);
      if (error.message === 'Failed to fetch') {
        alert('Cannot connect to the server. Please check if the backend is running and accessible.');
      } else {
        alert(`Failed to register palm: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const setAllowance = async () => {
    if (!allowanceAmount || allowanceAmount <= 0) {
      alert('Please enter a valid allowance amount');
      return;
    }

    try {
      await approveTokens({
        args: [SPENDER_ADDRESS, parseEther(allowanceAmount)],
      });
      setAllowanceAmount('');
    } catch (error) {
      console.error('Error setting allowance:', error);
      alert(`Failed to set allowance: ${error.message}`);
    }
  };

  const formattedAllowance = currentAllowance ? formatEther(currentAllowance) : '0';

  return (
    <div className="customer-view">
      <h2>Customer Panel</h2>

      <div className="section">
        <h3>Register Palm</h3>
        <div className="form-group">
          <div className="capture-options">
            <label className="file-upload-btn">
              <span> Take Photo or Choose Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {palmImage && (
            <div className="preview-container">
              <p className="file-info">Image ready for upload</p>
              <img
                src={palmImage instanceof File ? URL.createObjectURL(palmImage) : palmImage}
                alt="Palm preview"
                className="palm-preview"
              />
              <button
                onClick={() => setPalmImage(null)}
                className="btn-remove"
              >
                Remove
              </button>
            </div>
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
          <p className="current-allowance">
            Current Allowance: {formattedAllowance} tokens
          </p>
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