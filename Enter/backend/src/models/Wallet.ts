import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction {
  _id?: any;
  amount: number;
  type: 'credit' | 'debit' | 'recharge';
  utr?: string;
  screenshot?: string;
  status: 'pending' | 'approved' | 'rejected';
  description?: string;
  approvedAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  balance: number;
  transactions: ITransaction[];
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    amount: { type: Number, required: true },
    type: { type: String, enum: ['credit', 'debit', 'recharge'], required: true },
    utr: { type: String },
    screenshot: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    description: { type: String },
  },
  { timestamps: true }
);

const WalletSchema = new Schema<IWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    transactions: [TransactionSchema],
  },
  { timestamps: true }
);

export const Wallet = mongoose.model<IWallet>('Wallet', WalletSchema);
