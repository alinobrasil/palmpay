## Palm Pay
Pay for things in physical stores only using your palm. Works even if you forgot your wallet and phone at home.

Payments are done only using a stablecoin: PyUSD. Users can set a max amount for such automatic palm payments.


## Architecture
![Image](palmpay.drawio.png)

This project will have a backend server that stores and authenticates palm images. 

The customer's interface allows them to register palm and set max allowance for PalmPay's smart contract to spend their PyUSD.

The store/seller will have an interface that allows them to enter amount to charge and then scan the customer's palm. If there's a matching palm then the server will initiate a transaction. 