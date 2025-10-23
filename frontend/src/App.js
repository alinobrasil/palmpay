import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Customer from './Customer';
import Store from './Store';
import './App.css';

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [currentView, setCurrentView] = useState('home');

  // Check if wallet is already connected on load
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        setProvider(provider);
        setSigner(signer);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to use this application!');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setWalletAddress(address);
      setProvider(provider);
      setSigner(signer);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setProvider(null);
    setSigner(null);
    setCurrentView('home');
  };

  const handleMenuClick = (view) => {
    if (!walletAddress) {
      alert('Please connect your wallet first!');
      return;
    }
    setCurrentView(view);
  };

  const renderView = () => {
    if (!walletAddress) {
      return (
        <div className="connect-prompt">
          <h2>Welcome to PalmPay</h2>
          <p>Please connect your wallet to continue</p>
        </div>
      );
    }

    switch (currentView) {
      case 'customer':
        return <Customer walletAddress={walletAddress} signer={signer} />;
      case 'store':
        return <Store walletAddress={walletAddress} signer={signer} />;
      default:
        return (
          <div className="home-view">
            <h2>Select an option from the menu</h2>
          </div>
        );
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>PalmPay</h1>
        <div className="wallet-info">
          {walletAddress ? (
            <>
              <span className="wallet-address">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
              <button onClick={disconnectWallet} className="btn-disconnect">
                Disconnect
              </button>
            </>
          ) : (
            <button onClick={connectWallet} className="btn-connect">
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <nav className="menu">
        <button
          onClick={() => handleMenuClick('customer')}
          className={currentView === 'customer' ? 'active' : ''}
        >
          Customer
        </button>
        <button
          onClick={() => handleMenuClick('store')}
          className={currentView === 'store' ? 'active' : ''}
        >
          Store
        </button>
      </nav>

      <main className="content">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
