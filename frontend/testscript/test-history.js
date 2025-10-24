import { getHistory } from '../src/lib/history.js';

// Test with your customer address
const CUSTOMER_ADDRESS = '0x438E989d5eb3009caB3554D076415C7BBE845a48';

console.log('Fetching history for:', CUSTOMER_ADDRESS);
console.log('='.repeat(80));

getHistory(CUSTOMER_ADDRESS)
  .then(history => {
    console.log('Time'.padEnd(25) + 'Type'.padEnd(15) + 'Details'.padEnd(25) + 'Block');
    console.log('='.repeat(80));

    history.forEach(tx => {
      console.log(
        tx.time.padEnd(25) +
        tx.type.padEnd(15) +
        tx.details.padEnd(25) +
        tx.blockNumber
      );
    });

    console.log('='.repeat(80));
    console.log(`Total: ${history.length} transactions`);
  })
  .catch(err => {
    console.error('Error:', err.message);
  });
