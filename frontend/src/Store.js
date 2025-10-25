import React, { useState } from 'react';
import { useContractWrite, useWaitForTransaction } from 'wagmi';

// Contract config
const PALMPAY_CONTRACT = '0xcBDF0548025C208bAB08831E43514B6F1693F8c5';
const PALMPAY_ABI = [
  {
    name: 'registerStore',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'city', type: 'string' }
    ],
    outputs: []
  }
];

function Store({ walletAddress }) {
  const [storeName, setStoreName] = useState('');
  const [storeCity, setStoreCity] = useState('');
  const [registering, setRegistering] = useState(false);
  const [pendingTx, setPendingTx] = useState(null);
  const [usdAmount, setUsdAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const { writeAsync: registerStore } = useContractWrite({
    address: PALMPAY_CONTRACT,
    abi: PALMPAY_ABI,
    functionName: 'registerStore',
    chainId: 11155111,
  });

  const { isLoading: isConfirming } = useWaitForTransaction({
    hash: pendingTx,
    onSuccess: () => {
      setPendingTx(null);
      setRegistering(false);
      alert('Store registered successfully!');
      setStoreName('');
      setStoreCity('');
    },
  });

  const handleRegisterStore = async () => {
    if (!storeName || !storeCity) {
      alert('Please fill in all fields');
      return;
    }

    setRegistering(true);
    try {
      const tx = await registerStore({
        args: [storeName, storeCity],
      });

      setPendingTx(tx.hash);
      alert('Registration submitted! Waiting for confirmation...');

    } catch (error) {
      console.error('Error registering store:', error);
      alert(`Failed to register store: ${error.message}`);
      setRegistering(false);
    }
  };

  const chargeCustomer = async () => {
    if (!usdAmount || usdAmount <= 0) {
      alert('Please enter a valid USD amount');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        store_wallet: walletAddress,
        amount_usd: parseFloat(usdAmount)
      };

      const response = await fetch(`${API_BASE_URL}/charge_customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Charge failed');
      }

      const result = await response.json();
      alert(`Customer charged successfully!\nAmount: $${usdAmount}\nTransaction: ${result.transaction_hash || 'Pending'}`);
      setUsdAmount('');

    } catch (error) {
      console.error('Error charging customer:', error);
      alert(`Failed to charge customer: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="store-view">
      <h2>Store Panel</h2>

      <div className="section">
        <h3>Register Store</h3>
        <div className="form-group">
          <label>Store Name:</label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Enter store name"
            disabled={registering}
          />
        </div>
        <div className="form-group">
          <label>Store City:</label>
          <input
            type="text"
            value={storeCity}
            onChange={(e) => setStoreCity(e.target.value)}
            placeholder="Enter store city"
            disabled={registering}
          />
        </div>
        <button
          onClick={handleRegisterStore}
          disabled={registering || !storeName || !storeCity}
          className="btn-primary"
        >
          {isConfirming ? 'Confirming...' :
            registering ? 'Registering...' :
              'Register Store'}
        </button>
      </div>

      <div className="section">
        <h3>Charge Customer</h3>
        <div className="form-group">
          <label>USD Amount:</label>
          <input
            type="number"
            value={usdAmount}
            onChange={(e) => setUsdAmount(e.target.value)}
            placeholder="Enter dollar amount"
            disabled={loading}
            min="0"
            step="0.01"
          />
        </div>
        <button
          onClick={chargeCustomer}
          disabled={loading || !usdAmount}
          className="btn-primary"
        >
          {loading ? 'Processing...' : 'Charge Customer'}
        </button>
        <p className="info-text">
          Store Wallet: {walletAddress}
        </p>
      </div>
    </div>
  );
}

export default Store;
