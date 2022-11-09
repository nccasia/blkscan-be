export interface Transaction {
  blockHash: string;
  blockNumber: number;
  chainId: string;
  from: string;
  gas: number;
  gasPrice: string;
  hash: string;
  input: string;
  nonce: number;
  r: string;
  s: string;
  to: string;
  transactionIndex: number;
  type?: 0 | 2;
  v: string;
  value: string;
  accessList: Array<any>;
}