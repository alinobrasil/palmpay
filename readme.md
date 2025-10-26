## Palm Pay
Pay for things in physical stores only using your palm. Works even if you forgot your wallet and phone at home. Payments are done only using a stablecoin: PyUSD. Users can set a max amount for such automatic palm payments.


Video demo: https://youtu.be/G0Q4eGCOHOY
Frontend link: https://palmpay-six.vercel.app

## Disclaimer
Don't use this in production.
Still has many bugs. Frontend had some last minute wallet connect issues. Open frontend from desktop.


## Architecture
![Image](palmpay.drawio.png)

Palmpay's smart contract was tested & deployed using hardhat. Tested both locally using hardhat node forking ethereum mainnet. And also has a script testing everything on sepolia. (more details in /hardhat folder's readme)

The backend server stores and authenticates palm images, and also executes transactions. It authenticates users offchain with their signature. (read more in backend folder's readme)

The customer's interface allows them to register palm and set max allowance for PalmPay's smart contract to spend their PyUSD.

The store's interface allows them to enter amount to charge and then scan the customer's palm. If there's a verified palm then the server will create a transaction. As long as the amount is within the user's allowance it'll go through.

