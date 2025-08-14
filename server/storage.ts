import {
  users,
  clients,
  transactions,
  type User,
  type UpsertUser,
  type Client,
  type InsertClient,
  type Transaction,
  type InsertTransaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, or, ilike } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Client operations
  getClients(userId: string): Promise<Client[]>;
  getClient(id: number, userId: string): Promise<Client | undefined>;
  createClient(client: Omit<InsertClient, 'userId'>, userId: string): Promise<Client>;
  updateClient(id: number, client: Partial<Omit<InsertClient, 'userId'>>, userId: string): Promise<Client | undefined>;
  deleteClient(id: number, userId: string): Promise<boolean>;
  
  // Transaction operations
  getTransactions(clientId: number, userId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    type?: 'credit' | 'debit';
    search?: string;
  }): Promise<Transaction[]>;
  getTransaction(id: number, userId: string): Promise<Transaction | undefined>;
  createTransaction(transaction: Omit<InsertTransaction, 'userId'>, userId: string): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<Omit<InsertTransaction, 'userId' | 'balanceAfter'>>, userId: string): Promise<Transaction | undefined>;
  deleteTransaction(id: number, userId: string): Promise<boolean>;
  
  // Reports
  getMonthlyTotals(userId: string, year: number, month: number): Promise<{
    totalCredits: string;
    totalDebits: string;
    netBalance: string;
  }>;
  getClientBalance(clientId: number, userId: string): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Client operations
  async getClients(userId: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.userId, userId))
      .orderBy(desc(clients.createdAt));
  }

  async getClient(id: number, userId: string): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return client;
  }

  async createClient(client: Omit<InsertClient, 'userId'>, userId: string): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values({ ...client, userId })
      .returning();
    return newClient;
  }

  async updateClient(id: number, client: Partial<Omit<InsertClient, 'userId'>>, userId: string): Promise<Client | undefined> {
    const [updated] = await db
      .update(clients)
      .set({ ...client, updatedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .returning();
    return updated;
  }

  async deleteClient(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return result.rowCount > 0;
  }

  // Transaction operations
  async getTransactions(clientId: number, userId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    type?: 'credit' | 'debit';
    search?: string;
  }): Promise<Transaction[]> {
    let query = db
      .select()
      .from(transactions)
      .where(and(eq(transactions.clientId, clientId), eq(transactions.userId, userId)));

    if (filters?.startDate) {
      query = query.where(gte(transactions.date, filters.startDate));
    }
    if (filters?.endDate) {
      query = query.where(lte(transactions.date, filters.endDate));
    }
    if (filters?.type === 'credit') {
      query = query.where(eq(transactions.creditAmount, '0'));
    }
    if (filters?.type === 'debit') {
      query = query.where(eq(transactions.debitAmount, '0'));
    }
    if (filters?.search) {
      query = query.where(
        or(
          ilike(transactions.particulars, `%${filters.search}%`),
          ilike(transactions.billNo, `%${filters.search}%`)
        )
      );
    }

    return await query.orderBy(desc(transactions.date));
  }

  async getTransaction(id: number, userId: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    return transaction;
  }

  async createTransaction(transaction: Omit<InsertTransaction, 'userId'>, userId: string): Promise<Transaction> {
    // Calculate balance after this transaction
    const latestTransactions = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.clientId, transaction.clientId), eq(transactions.userId, userId)))
      .orderBy(desc(transactions.date))
      .limit(1);

    const previousBalance = latestTransactions.length > 0 
      ? parseFloat(latestTransactions[0].balanceAfter) 
      : 0;

    const debitAmount = parseFloat(transaction.debitAmount || '0');
    const creditAmount = parseFloat(transaction.creditAmount || '0');
    const balanceAfter = (previousBalance + creditAmount - debitAmount).toString();

    const [newTransaction] = await db
      .insert(transactions)
      .values({ 
        ...transaction, 
        userId,
        balanceAfter
      })
      .returning();
    
    return newTransaction;
  }

  async updateTransaction(id: number, transaction: Partial<Omit<InsertTransaction, 'userId' | 'balanceAfter'>>, userId: string): Promise<Transaction | undefined> {
    // Get the transaction to update
    const existingTransaction = await this.getTransaction(id, userId);
    if (!existingTransaction) return undefined;

    // Update the transaction
    const [updated] = await db
      .update(transactions)
      .set(transaction)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();

    if (!updated) return undefined;

    // Recalculate balances for all subsequent transactions
    await this.recalculateBalances(updated.clientId, userId);
    
    return updated;
  }

  async deleteTransaction(id: number, userId: string): Promise<boolean> {
    const transaction = await this.getTransaction(id, userId);
    if (!transaction) return false;

    const result = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

    if (result.rowCount > 0) {
      // Recalculate balances for remaining transactions
      await this.recalculateBalances(transaction.clientId, userId);
      return true;
    }
    return false;
  }

  private async recalculateBalances(clientId: number, userId: string): Promise<void> {
    const allTransactions = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.clientId, clientId), eq(transactions.userId, userId)))
      .orderBy(transactions.date);

    let runningBalance = 0;
    for (const transaction of allTransactions) {
      const debitAmount = parseFloat(transaction.debitAmount || '0');
      const creditAmount = parseFloat(transaction.creditAmount || '0');
      runningBalance = runningBalance + creditAmount - debitAmount;

      await db
        .update(transactions)
        .set({ balanceAfter: runningBalance.toString() })
        .where(eq(transactions.id, transaction.id));
    }
  }

  async getMonthlyTotals(userId: string, year: number, month: number): Promise<{
    totalCredits: string;
    totalDebits: string;
    netBalance: string;
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const monthlyTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );

    let totalCredits = 0;
    let totalDebits = 0;

    for (const transaction of monthlyTransactions) {
      totalCredits += parseFloat(transaction.creditAmount || '0');
      totalDebits += parseFloat(transaction.debitAmount || '0');
    }

    return {
      totalCredits: totalCredits.toString(),
      totalDebits: totalDebits.toString(),
      netBalance: (totalCredits - totalDebits).toString(),
    };
  }

  async getClientBalance(clientId: number, userId: string): Promise<string> {
    const latestTransaction = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.clientId, clientId), eq(transactions.userId, userId)))
      .orderBy(desc(transactions.date))
      .limit(1);

    return latestTransaction.length > 0 ? latestTransaction[0].balanceAfter : '0';
  }
}

export const storage = new DatabaseStorage();
