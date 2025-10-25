import React, { useState, useRef } from 'react';
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import PropTypes from 'prop-types';
import { getErrorMessage } from './lib/errorUtils';

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

// Placeholder API URL - update this later
const API_BASE_URL = 'https://palmpay-production.up.railway.app';

function Store({ walletAddress }) {
  // Add debug log when component mounts
  React.useEffect(() => {
    console.log('Store component mounted with wallet:', walletAddress);
  }, [walletAddress]);

  const [storeName, setStoreName] = useState('');
  const [storeCity, setStoreCity] = useState('');
  const [registering, setRegistering] = useState(false);
  const [pendingTx, setPendingTx] = useState(null);
  const [usdAmount, setUsdAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [palmImage, setPalmImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null); // Add canvas ref

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
      alert(`Failed to register store: ${getErrorMessage(error)}`);
      setRegistering(false);
    }
  };

  const handlePalmImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPalmImage(e.target.files[0]);
    }
  };

  const startCamera = async () => {
    try {
      // Check if camera API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser. Please open this page in Safari or Chrome.');
      }

      setShowCamera(true); // Show modal first

      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Wait for video to be ready
        videoRef.current.onloadeddata = () => {
          console.log('Camera stream ready');
          setIsStreamReady(true);
        };
      } else {
        throw new Error('Video element not found');
      }

    } catch (err) {
      console.error('Camera error:', err);
      setShowCamera(false);
      setIsStreamReady(false);
      alert(`Camera error: ${getErrorMessage(err)}`);
    }
  };

  const capturePalm = () => {
    if (!videoRef.current || !isStreamReady) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          setPalmImage(new File([blob], 'palm.jpg', { type: 'image/jpeg' }));
          stopCamera();
        } else {
          throw new Error('Failed to capture image');
        }
      }, 'image/jpeg', 0.8);
    } catch (err) {
      console.error('Capture error:', err);
      alert('Failed to capture image. Please try again.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      setShowCamera(false);
      setIsStreamReady(false);
    }
  };

  const handleChargeClick = () => {
    if (!usdAmount || usdAmount <= 0) {
      alert('Please enter a valid USD amount');
      return;
    }
    startCamera();
  };

  const chargeCustomer = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('palm_image', palmImage);
      formData.append('amount_usd', usdAmount.toString());
      formData.append('store_address', walletAddress.toLowerCase());

      const response = await fetch(`${API_BASE_URL}/scanned_palm`, {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.detail || 'Charge failed');
        } catch (e) {
          throw new Error(responseText || 'Charge failed');
        }
      }

      const result = responseText ? JSON.parse(responseText) : {};
      alert(`Customer charged successfully!\nAmount: $${usdAmount}`);
      setUsdAmount('');
      setPalmImage(null);

    } catch (error) {
      console.error('Error charging customer:', error);
      alert(`Failed to charge customer: ${getErrorMessage(error)}`);
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
          onClick={handleChargeClick}
          disabled={loading || !usdAmount}
          className="btn-primary"
        >
          {loading ? 'Processing...' : 'Scan Palm'}
        </button>

        {showCamera && (
          <div className="camera-modal">
            <div className="camera-content">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: '100%', maxWidth: '400px' }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className="camera-controls">
                <button
                  onClick={capturePalm}
                  className="btn-primary"
                  disabled={!isStreamReady}
                >
                  {isStreamReady ? 'Capture' : 'Loading camera...'}
                </button>
                <button onClick={stopCamera} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {palmImage && !showCamera && (
          <div className="preview-section">
            <p className="file-info">Palm image captured</p>
            <button
              onClick={chargeCustomer}
              disabled={loading}
              className="btn-primary"
            >
              Confirm Charge ${usdAmount}
            </button>
          </div>
        )}
        <p className="info-text">
          Store Wallet: {walletAddress}
        </p>
      </div>
    </div>
  );
}

Store.propTypes = {
  walletAddress: PropTypes.string.isRequired
};

export default Store;
