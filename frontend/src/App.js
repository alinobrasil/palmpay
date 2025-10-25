import React, { useState } from 'react';
import { WagmiConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';
import { Web3Button, Web3Modal } from '@web3modal/react';
import { wagmiConfig, ethereumClient, WALLETCONNECT_PROJECT_ID } from './config/wagmiConfig';
import ErrorBoundary from './ErrorBoundary';
import Customer from './Customer';
import Store from './Store';
import './App.css';

// Separate ConnectButton component
function ConnectButton() {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  const isWrongNetwork = chain && chain.id !== sepolia.id;

  if (address) {
    return (
      <>
        <div className="network-info">
          <span className={`network-badge ${isWrongNetwork ? 'wrong-network' : 'correct-network'}`}>
            {chain ? chain.name : 'Unknown Network'}
          </span>
          {isWrongNetwork && (
            <button
              onClick={() => switchNetwork?.(sepolia.id)}
              className="btn-switch-network"
            >
              Switch to Sepolia
            </button>
          )}
        </div>
        <span className="wallet-address">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <Web3Button />
      </>
    );
  }

  return <Web3Button />;
}

// Separate AppContent component that uses wagmi hooks
function AppContent() {
  const [currentView, setCurrentView] = useState('home');
  const [isReady, setIsReady] = useState(false);
  const { address, isConnected } = useAccount();

  // Wait for component to mount before using wagmi hooks
  React.useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div className="App">
        <header className="header">
          <h1>PalmPay</h1>
        </header>
        <main className="content">
          <div className="connect-prompt">
            <h2>Loading...</h2>
          </div>
        </main>
      </div>
    );
  }

  const handleMenuClick = (view) => {
    if (!isConnected) {
      alert('Please connect your wallet first!');
      return;
    }
    setCurrentView(view);
  };

  return (
    <div className="App">
      <header className="header">
        <h1>PalmPay</h1>
        <div className="wallet-info">
          <ConnectButton />
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
        {!isConnected ? (
          <div className="connect-prompt">
            <h2>Welcome to PalmPay</h2>
            <p>Please connect your wallet to continue</p>
          </div>
        ) : (
          <>
            {currentView === 'customer' && <Customer />}
            {currentView === 'store' && <Store walletAddress={address} />}
            {currentView === 'home' && (
              <div className="home-view">
                <h2>Select an option from the menu</h2>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Main App component that provides WagmiConfig
function App() {
  return (
    <ErrorBoundary>
      <WagmiConfig config={wagmiConfig}>
        <AppContent />
      </WagmiConfig>
      <Web3Modal
        projectId={WALLETCONNECT_PROJECT_ID}
        ethereumClient={ethereumClient}
        themeMode="light"
      />
    </ErrorBoundary>
  );
}

export default App;