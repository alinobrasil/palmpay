// Shared history fetcher for React pages
// Usage: import { getHistory } from '../lib/history';

// Configuration
const TOKEN_SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/53192/paypal-usd-sepolia/version/latest';
const PALMPAY_SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/53192/palm-pay-eth-sepolia/version/latest';
const SPENDER_ADDRESS = '0xcBDF0548025C208bAB08831E43514B6F1693F8c5'.toLowerCase(); // palmpay contract address

function formatAmount(value) {
  return (Number(value) / 1e6).toFixed(2);
}

function formatTimestamp(timestamp) {
  return new Date(Number(timestamp) * 1000).toLocaleString();
}

async function querySubgraph(url, query) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const json = await response.json();
  if (!response.ok) {
    const msg = json?.errors?.[0]?.message || response.statusText;
    throw new Error(`Subgraph error (${url}): ${msg}`);
  }
  return json;
}

/**
 * Fetch a unified transaction history for a given customer.
 * @param {string} customerAddress - EVM address of the customer
 * @returns {Promise<Array<{time:string,timestamp:number,type:'Approval'|'Spending',details:string,blockNumber:number}>>}
 */
export async function getHistory(customerAddress) {
  if (!customerAddress) throw new Error('customerAddress is required');
  const CUSTOMER = customerAddress.toLowerCase();

  const approvalQuery = `
    {
      approvals(
        first: 100
        orderBy: blockTimestamp
        orderDirection: desc
        where: {
          owner: "${CUSTOMER}"
          spender: "${SPENDER_ADDRESS}"
        }
      ) {
        value
        blockTimestamp
        blockNumber
        transactionHash
      }
    }
  `;

  const chargeQuery = `
    {
      chargeRecordeds(
        first: 100
        orderBy: blockTimestamp
        orderDirection: desc
        where: {
          customer: "${CUSTOMER}"
        }
      ) {
        amount
        blockTimestamp
        blockNumber
        transactionHash
        store
      }
    }
  `;

  const [approvalData, chargeData] = await Promise.all([
    querySubgraph(TOKEN_SUBGRAPH_URL, approvalQuery),
    querySubgraph(PALMPAY_SUBGRAPH_URL, chargeQuery),
  ]);

  const approvals = (approvalData.data?.approvals || []).map(a => ({
    time: formatTimestamp(a.blockTimestamp),
    timestamp: Number(a.blockTimestamp),
    type: 'Approval',
    details: `$${formatAmount(a.value)} approved`,
    blockNumber: a.blockNumber,
  }));

  const charges = (chargeData.data?.chargeRecordeds || []).map(c => ({
    time: formatTimestamp(c.blockTimestamp),
    timestamp: Number(c.blockTimestamp),
    type: 'Spending',
    details: `$${formatAmount(c.amount)} spent`,
    blockNumber: c.blockNumber,
  }));

  return [...approvals, ...charges].sort((a, b) => b.timestamp - a.timestamp);
}

export default getHistory;
