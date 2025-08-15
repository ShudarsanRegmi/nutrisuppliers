import { z } from "zod";

// Firebase User type
export interface FirebaseUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Client types
export interface Client {
  id: string;
  userId: string;
  name: string; // This will be the display name (company or individual)
  companyName?: string | null; // Separate company name field
  contactPerson?: string | null; // Contact person name
  contact?: string | null;
  email?: string | null;
  address?: string | null;
  panNumber?: string | null; // PAN number for tax purposes
  createdAt: Date;
  updatedAt: Date;
  // Computed fields (calculated on client-side)
  balance?: number;
  transactionCount?: number;
  lastActivity?: Date;
}

export interface InsertClient {
  name: string; // Display name
  companyName?: string | null;
  contactPerson?: string | null;
  contact?: string | null;
  email?: string | null;
  address?: string | null;
  panNumber?: string | null;
}

// Transaction types with proper data types
export interface Transaction {
  id: string;
  date: Date;
  particulars: string;
  billNo?: string | null;
  debitAmount: number;  // Amount client owes (took product/service)
  creditAmount: number; // Amount client paid
  createdAt: Date;
  // balanceAfter is calculated on the fly, not stored
}

// Transaction with calculated balance (for UI display)
export interface TransactionWithBalance extends Transaction {
  balanceAfter: number; // Calculated based on sort order
}

// Transaction with client information (for dashboard/reports)
export interface TransactionWithClient extends Transaction {
  clientName: string;
  clientId: string;
}

export interface InsertTransaction {
  date: Date;
  particulars: string;
  billNo?: string | null;
  debitAmount?: number;  // Changed from string to number
  creditAmount?: number; // Changed from string to number
}

// Validation schemas
export const insertClientSchema = z.object({
  name: z.string().min(1, "Display name is required"),
  companyName: z.string().nullish(),
  contactPerson: z.string().nullish(),
  contact: z.string().nullish(),
  email: z.string().email().nullish().or(z.literal("")),
  address: z.string().nullish(),
  panNumber: z.string().nullish(),
});

export const insertTransactionSchema = z.object({
  date: z.date(),
  particulars: z.string().min(1, "Particulars is required"),
  billNo: z.string().nullish(),
  debitAmount: z.number().min(0, "Debit amount must be positive").nullish(),
  creditAmount: z.number().min(0, "Credit amount must be positive").nullish(),
}).refine(
  (data) => {
    const debit = data.debitAmount || 0;
    const credit = data.creditAmount || 0;
    return debit > 0 || credit > 0;
  },
  {
    message: "Either debit or credit amount must be greater than 0",
    path: ["debitAmount"],
  }
);

// Monthly totals type for reports
export interface MonthlyTotals {
  totalDebit: number;
  totalCredit: number;
  netAmount: number;
  transactionCount: number;
}
