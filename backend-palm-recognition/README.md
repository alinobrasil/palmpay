Starting point - using [EDCC palm recognition](https://github.com/leosocy/EDCC-Palmprint-Recognition?tab=readme-ov-file) repo for verifying palms. It has MIT license. 

This backend runs an API server using Flask. It can register & verify palms and ultimately execute token transfers as allowed by the customer.


## API Endpoints

### Main endpoints:

#### POST `/register`
- Register a new palmprint for a wallet address.
- Expects:
	- `wallet_address` (string, required)
	- `palm_image` (file, required)
	- `message` (string, optional, for signature verification)
	- `signature` (string, optional, for signature verification)
- Returns: registration status, wallet address, filename, total palms for wallet

#### POST `/scanned_palm`
- Process palm scan for payment (identify customer and execute payment).
- Expects:
	- `palm_image` (file, required)
	- `amount_usd` (number, required)
	- `store_address` (string, required)
- Returns: transaction details or error

### Supporting endpoints:

#### GET `/`
- Health check.
- Returns status, number of registered wallets, total palmprints, and similarity threshold.

#### POST `/identify`
- Identify a palmprint by comparing against all registered palmprints.
- Expects: `palm_image` (file, required)
- Returns: `match_found`, `wallet_address`, `similarity_score`, `threshold`



#### POST `/reload`
- Reload registered palmprints from disk (use after adding new palmprints manually).
- No parameters.
- Returns: reload status, number of wallets, total palmprints

------

Just run the dockerfile.