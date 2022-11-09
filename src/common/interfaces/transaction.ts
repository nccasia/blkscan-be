export type TransactionType = 0 | 2 | null;

export interface ITransaction {
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
  type?: TransactionType;
  v: string;
  value: string;
  accessList: Array<any>;
}
