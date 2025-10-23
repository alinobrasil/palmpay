import React, { useState } from 'react';

// Placeholder API URL - update this later
const API_BASE_URL = 'http://localhost:8000';

function Store({ walletAddress, signer }) {
  const [usdAmount, setUsdAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const chargeCustomer = async () => {
    if (!usdAmount || usdAmount <= 0) {
      alert('Please enter a valid USD amount');
      return;
    }

    setLoading(true);

    try {
      // Prepare request data
      const requestData = {
        store_wallet: walletAddress,
        amount_usd: parseFloat(usdAmount)
      };

      // Call API endpoint
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
