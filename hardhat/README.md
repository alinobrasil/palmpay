
# Pre reqs:
make sure to fill out .env file if you want to deploy the contract.

To deploy:
```
rm -rf ignition/deployments/chain-11155111

npx hardhat ignition deploy ignition/modules/PalmPay.ts --network sepolia --parameters ignition/parameters.json
```

It's already on sepolia:
https://eth-sepolia.blockscout.com/address/0xcBDF0548025C208bAB08831E43514B6F1693F8c5?tab=contract


# Testing
## Testing with hardhat node (fork ethereum)
To test the functionality of the smart contract, first run hardhat node, forking ethereum mainnet, utilizing paypal USD:

```
npx hardhat node --fork (your rpc url here)
```

then in a separate terminal, run:
```
npx hardhat test
```


## Testing on sepolia testnet
try running this script doing everything directly on sepolia testnet.
```
npx hardhat run scripts/test-record-charge.ts
```

It'll step through the entire process:
1. check customer balance
2. approve palmpay contract to spend some paypal usd
3. register customer
4. register store
5. get customer nonce
6. store charges customer 
This will transfer paypal usd from customer to store.

## About the smart contract


-----
