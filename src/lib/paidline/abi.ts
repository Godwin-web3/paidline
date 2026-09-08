export const PAIDLINE_ABI = [
  "function nextInvoiceId() view returns (uint256)",
  "function invoices(uint256) view returns (address merchant,uint256 chainKey,address sourceToken,address sourceRecipient,uint256 sourceAmount,uint64 expiry,uint256 localAmount,address localReleaseTo,uint8 status,bool funded,bytes32 paidTxHash,string title,string releaseLabel)",
  "function invoicesOf(address merchant) view returns (uint256[])",
  "function isPaid(uint256 invoiceId) view returns (bool)",
  "function openTerms(bytes32) view returns (uint256)",
  "function createInvoice(uint256 chainKey,address sourceToken,address sourceRecipient,uint256 sourceAmount,uint64 expiry,string title,string releaseLabel) payable returns (uint256)",
  "function cancel(uint256 invoiceId)",
  "function submitPayment(uint256 invoiceId,bytes32 sourceTxHash,uint64 chainKey,uint64 blockHeight,bytes encodedTransaction,bytes32 merkleRoot,(bytes32 hash,bool isLeft)[] siblings,bytes32 lowerEndpointDigest,bytes32[] continuityRoots) returns (bool)",
] as const;

export const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to,uint256 value) returns (bool)",
] as const;
