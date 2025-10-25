import React, { useState } from 'react';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import Customer from './Customer';
import Store from './Store';
import './App.css';

// Configure chains & providers
const { chains, publicClient } = configureChains(
  [sepolia],
  [publicProvider()]
);

// Set up wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains })
  ],
  publicClient,
});

// Separate ConnectButton component
function ConnectButton() {
  const { address } = useAccount();
  const { connect } = useConnect({
    connector: new MetaMaskConnector({ chains }),
  });
  const { disconnect } = useDisconnect();

  if (address) {
    return (
      <>
        <span className="wallet-address">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button onClick={() => disconnect()} className="btn-disconnect">
          Disconnect
        </button>
      </>
    );
  }

  return (
    <button onClick={() => connect()} className="btn-connect">
      Connect MetaMask
    </button>
  );
}

// Separate AppContent component that uses wagmi hooks
function AppContent() {
  const [currentView, setCurrentView] = useState('home');
  const { isConnected } = useAccount();

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
            {currentView === 'store' && <Store />}
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
    <WagmiConfig config={wagmiConfig}>
      <AppContent />
    </WagmiConfig>
  );
}

export default App;