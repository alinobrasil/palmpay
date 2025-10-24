import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { ethers } from 'ethers';
import './Customer.css';

// Placeholder addresses - update these later
const TOKEN_ADDRESS = '0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9';
const SPENDER_ADDRESS = '0x438E989d5eb3009caB3554D076415C7BBE845a48';

// Placeholder API URL - update this later
const API_BASE_URL = 'http://localhost:8000';

// ERC20 Token ABI (only approve function)
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

function Customer({ walletAddress, signer }) {
  const [palmImage, setPalmImage] = useState(null);
  const [allowanceAmount, setAllowanceAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentAllowance, setCurrentAllowance] = useState('0');
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef(null);

  const videoConstraints = {
    width: 720,
    height: 720,
    facingMode: "user"
  };

  const capture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    // Convert base64 to blob
    const blob = await fetch(imageSrc).then(r => r.blob());
    const imageFile = new File([blob], "palm.jpg", { type: "image/jpeg" });
    setPalmImage(imageFile);
    setShowCamera(false);
  };

  const fetchTransactionHistory = async () => {
    setLoadingTx(true);
    try {
      // Create token contract instance
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer);

      // Get past Approval events
      const filter = tokenContract.filters.Approval(walletAddress, SPENDER_ADDRESS);
      const events = await tokenContract.queryFilter(filter, -1000); // Last 1000 blocks

      const txHistory = await Promise.all(events.map(async (event) => {
        const block = await event.getBlock();
        return {
          txHash: event.transactionHash,
          amount: ethers.formatUnits(event.args.value, 18),
          timestamp: new Date(block.timestamp * 1000).toLocaleString(),
        };
      }));

      setTransactions(txHistory);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      alert('Failed to fetch transaction history');
    } finally {
      setLoadingTx(false);
    }
  };

  const checkAllowance = async () => {
    try {
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer);
      const allowance = await tokenContract.allowance(walletAddress, SPENDER_ADDRESS);
      const formattedAllowance = ethers.formatUnits(allowance, 18);
      setCurrentAllowance(formattedAllowance);
    } catch (error) {
      console.error('Error checking allowance:', error);
      alert('Failed to check allowance');
    }
  };

  // Add useEffect to check allowance on component mount and after setting new allowance. And to fetch transaction history
  useEffect(() => {
    if (signer && walletAddress) {
      checkAllowance();
      fetchTransactionHistory();
    }
  }, [signer, walletAddress]);

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
      await checkAllowance();
      await fetchTransactionHistory();

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
          <div className="capture-options">
            <button
              onClick={() => setShowCamera(!showCamera)}
              className="btn-secondary"
              disabled={loading}
            >
              {showCamera ? 'Close Camera' : 'Open Camera'}
            </button>
            <div className="or-divider">OR</div>
            <label className="file-upload-btn">
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {showCamera && (
            <div className="camera-container">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="webcam"
              />
              <button
                onClick={capture}
                className="btn-capture"
                disabled={loading}
              >
                📸 Capture
              </button>
            </div>
          )}

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
            Current Allowance: {currentAllowance} tokens
            <button
              onClick={checkAllowance}
              className="btn-refresh"
              disabled={loading}
            >
              🔄 Refresh
            </button>
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

      <div className="section">
        <h3>Transaction History</h3>
        <div className="transaction-list">
          <button
            onClick={fetchTransactionHistory}
            className="btn-refresh"
            disabled={loadingTx}
          >
            🔄 Refresh History
          </button>
          {loadingTx ? (
            <p>Loading transactions...</p>
          ) : transactions.length > 0 ? (
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.txHash}>
                    <td>{tx.timestamp}</td>
                    <td>{tx.amount} tokens</td>
                    <td>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No transactions found</p>
          )}
        </div>
      </div>
    </div >
  );
}

export default Customer;
