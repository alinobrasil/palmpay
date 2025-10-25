import React, { useState } from 'react';
import { useAccount, useSignMessage, useContractWrite, useContractRead, useWaitForTransaction } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import './Customer.css';
import { getHistory } from './lib/history';

// Placeholder addresses - update these later
const TOKEN_ADDRESS = '0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9';
const SPENDER_ADDRESS = '0xcBDF0548025C208bAB08831E43514B6F1693F8c5';

// Placeholder API URL - update this later
const API_BASE_URL = 'https://palmpay-production.up.railway.app';

// ERC20 Token ABI (only approve function)
const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

// Add this utility function at the top of the file
function formatNumber(value) {
  const num = parseFloat(value);
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
}

function Customer() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [palmImage, setPalmImage] = useState(null);
  const [allowanceAmount, setAllowanceAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingTx, setPendingTx] = useState(null);
  const [txHistory, setTxHistory] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

  const { data: currentAllowance, refetch: refetchAllowance } = useContractRead({
    address: TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address, SPENDER_ADDRESS],
    watch: true,
  });

  const { writeAsync: approveTokens } = useContractWrite({
    address: TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'approve',
    chainId: 11155111,
    onError: (error) => {
      console.error('Contract write error:', error);
    },
  });

  const { isLoading: isConfirming } = useWaitForTransaction({
    hash: pendingTx,
    onSuccess: () => {
      refetchAllowance();
      setPendingTx(null);
      setLoadingTx(false);
      alert('Transaction confirmed!');
    },
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

  const addTransaction = (hash, description) => {
    const newTx = {
      hash,
      description,
      timestamp: new Date().toISOString(),
    };
    setTxHistory(prev => [newTx, ...prev]);
  };

  const setAllowance = async () => {
    if (!allowanceAmount || allowanceAmount <= 0) {
      alert('Please enter a valid allowance amount');
      return;
    }

    setLoadingTx(true);
    try {
      const amount = parseUnits(allowanceAmount, 6);
      console.log('Setting allowance of', amount.toString(), 'wei');

      let tx;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          tx = await approveTokens({
            args: [SPENDER_ADDRESS, amount],
            gas: BigInt(100000), // Set explicit gas limit
          });
          break;
        } catch (err) {
          if (attempt === 2) throw err;
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      if (!tx?.hash) {
        throw new Error('No transaction hash received');
      }

      setPendingTx(tx.hash);
      addTransaction(tx.hash, `Approve ${allowanceAmount} tokens`);
      alert('Transaction submitted! Waiting for confirmation...');
      setAllowanceAmount('');

    } catch (error) {
      console.error('Error setting allowance:', error);
      alert(`Failed to set allowance: ${error.message}`);
      setLoadingTx(false);
    }
  };

  const formattedAllowance = currentAllowance ? formatUnits(currentAllowance, 6) : '0';

  React.useEffect(() => {
    if (address) {
      getHistory(address).then(history => {
        setTxHistory(history);
      });
    }
  }, [address]);

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
            <button
              onClick={() => refetchAllowance()}
              className="btn-refresh"
              disabled={loadingTx}
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
            disabled={loadingTx}
            min="0"
            step="0.01"
          />
        </div>
        <button
          onClick={setAllowance}
          disabled={loadingTx || !allowanceAmount}
          className="btn-primary"
        >
          {isConfirming ? 'Confirming...' :
            loadingTx ? 'Processing...' :
              'Set Allowance'}
        </button>
      </div>

      <div className="section">
        <h3>Transaction History</h3>
        {txHistory.length === 0 ? (
          <p className="no-transactions">No transactions found</p>
        ) : (
          <div className="transaction-table">
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Transaction</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {txHistory.map((tx) => {
                  if (!tx || !tx.details) return null;

                  const amountMatch = tx.details.match(/\$?([\d.]+)/);
                  const amount = amountMatch ? amountMatch[1] : '0';
                  const date = new Date(tx.timestamp * 1000);
                  const formattedDate = date.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  const formattedTime = date.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={tx.blockNumber || Date.now()} className="tx-row">
                      <td>
                        <div className="tx-date">
                          <span className="tx-day">{formattedDate}</span>
                          <span className="tx-time">{formattedTime}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`tx-badge ${(tx.type || '').toLowerCase()}`}>
                          {tx.type || 'Unknown'}
                        </span>
                      </td>
                      <td>
                        <span className="transaction-amount">
                          ${formatNumber(amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Customer;