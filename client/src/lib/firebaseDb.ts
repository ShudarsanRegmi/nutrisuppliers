import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  Timestamp,
  writeBatch,
  onSnapshot,
  QueryConstraint,
  deleteField,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Client,
  InsertClient,
  Transaction,
  TransactionWithBalance,
  InsertTransaction,
  FirebaseUser,
  MonthlyTotals,
} from "./firebaseTypes";

// Collection references
const getUsersCollection = () => collection(db, "users");
const getClientsCollection = (userId: string) => collection(db, `users/${userId}/clients`);
const getTransactionsCollection = (userId: string, clientId: string) =>
  collection(db, `users/${userId}/clients/${clientId}/transactions`);

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

// User operations
export const createOrUpdateUser = async (userData: Omit<FirebaseUser, "createdAt" | "updatedAt">): Promise<void> => {
  const userRef = doc(getUsersCollection(), userData.id);
  const now = new Date();

  try {
    const existingUser = await getDoc(userRef);

    if (existingUser.exists()) {
      await updateDoc(userRef, {
        ...userData,
        updatedAt: Timestamp.fromDate(now),
      });
    } else {
      // Use setDoc for creating new documents
      await setDoc(userRef, {
        ...userData,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
    }
  } catch (error) {
    console.error("Error creating/updating user:", error);
    throw error;
  }
};

export const getUser = async (userId: string): Promise<FirebaseUser | null> => {
  const userRef = doc(getUsersCollection(), userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      id: userSnap.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      profileImageUrl: data.profileImageUrl,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    };
  }
  
  return null;
};

// Client operations
export const getClients = async (userId: string): Promise<Client[]> => {
  const clientsRef = getClientsCollection(userId);
  const q = query(clientsRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    userId,
    ...doc.data(),
    createdAt: convertTimestamp(doc.data().createdAt),
    updatedAt: convertTimestamp(doc.data().updatedAt),
  } as Client));
};

export const createClient = async (userId: string, clientData: InsertClient): Promise<Client> => {
  const clientsRef = getClientsCollection(userId);
  const now = new Date();

  const docRef = await addDoc(clientsRef, {
    ...clientData,
    userId,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  });

  return {
    id: docRef.id,
    userId,
    ...clientData,
    createdAt: now,
    updatedAt: now,
  };
};



export const updateClient = async (
  userId: string,
  clientId: string,
  clientData: Partial<InsertClient>
): Promise<Client> => {
  try {
    console.log("Updating client:", clientId, "with data:", clientData);

    const clientRef = doc(getClientsCollection(userId), clientId);
    const now = new Date();

    const updateData = {
      ...clientData,
      updatedAt: Timestamp.fromDate(now),
    };

    await updateDoc(clientRef, updateData);

    // Get the updated client
    const updatedDoc = await getDoc(clientRef);
    const data = updatedDoc.data();

    if (!data) {
      throw new Error("Client not found after update");
    }

    return {
      id: clientId,
      userId: data.userId,
      name: data.name,
      companyName: data.companyName || null,
      contactPerson: data.contactPerson || null,
      contact: data.contact || null,
      email: data.email || null,
      address: data.address || null,
      panNumber: data.panNumber || null,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    };
  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
};

export const deleteClient = async (userId: string, clientId: string): Promise<void> => {
  const batch = writeBatch(db);

  // Delete client
  const clientRef = doc(getClientsCollection(userId), clientId);
  batch.delete(clientRef);

  // Delete all transactions for this client (they're now subcollections)
  const transactionsRef = getTransactionsCollection(userId, clientId);
  const transactionsSnapshot = await getDocs(transactionsRef);

  transactionsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
};

// Transaction operations with pagination support
export const getTransactions = async (
  userId: string,
  clientId: string,
  filters?: {
    searchTerm?: string;
    transactionType?: "all" | "debit" | "credit";
    startDate?: string;
    endDate?: string;
    pageSize?: number;
    sortField?: "date" | "createdAt";
    sortOrder?: "asc" | "desc";
  }
): Promise<{
  transactions: Transaction[];
  totalCount: number;
  hasMore: boolean;
}> => {
  const transactionsRef = getTransactionsCollection(userId, clientId);

  // Default values
  const pageSize = filters?.pageSize || 10;
  const sortField = filters?.sortField || "createdAt";
  const sortOrder = filters?.sortOrder || "asc";

  // First, get total count for pagination info
  const totalSnapshot = await getDocs(query(transactionsRef));
  const totalCount = totalSnapshot.size;

  // Build query constraints
  const constraints: QueryConstraint[] = [
    orderBy(sortField, sortOrder),
    limit(pageSize),
  ];

  const querySnapshot = await getDocs(query(transactionsRef, ...constraints));

  let transactions = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      date: convertTimestamp(data.date),
      particulars: data.particulars,
      billNo: data.billNo || null,
      debitAmount: typeof data.debitAmount === 'number' ? data.debitAmount : parseFloat(data.debitAmount || "0"),
      creditAmount: typeof data.creditAmount === 'number' ? data.creditAmount : parseFloat(data.creditAmount || "0"),
      createdAt: convertTimestamp(data.createdAt),
    } as Transaction;
  });

  // Apply client-side filters
  if (filters) {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      transactions = transactions.filter(t =>
        t.particulars.toLowerCase().includes(searchLower) ||
        t.billNo?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.transactionType && filters.transactionType !== "all") {
      transactions = transactions.filter(t => {
        const debit = t.debitAmount || 0;
        const credit = t.creditAmount || 0;
        return filters.transactionType === "debit" ? debit > 0 : credit > 0;
      });
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      transactions = transactions.filter(t => t.date >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      transactions = transactions.filter(t => t.date <= endDate);
    }
  }

  return {
    transactions,
    totalCount,
    hasMore: querySnapshot.docs.length === pageSize && totalCount > pageSize,
  };
};

// Get all transactions without pagination (for balance calculations)
export const getAllTransactions = async (
  userId: string,
  clientId: string,
  sortField: "date" | "createdAt" = "createdAt",
  sortOrder: "asc" | "desc" = "asc"
): Promise<Transaction[]> => {
  const transactionsRef = getTransactionsCollection(userId, clientId);
  const constraints: QueryConstraint[] = [
    orderBy(sortField, sortOrder),
  ];

  const querySnapshot = await getDocs(query(transactionsRef, ...constraints));

  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      date: convertTimestamp(data.date),
      particulars: data.particulars,
      billNo: data.billNo || null,
      debitAmount: typeof data.debitAmount === 'number' ? data.debitAmount : parseFloat(data.debitAmount || "0"),
      creditAmount: typeof data.creditAmount === 'number' ? data.creditAmount : parseFloat(data.creditAmount || "0"),
      createdAt: convertTimestamp(data.createdAt),
    } as Transaction;
  });
};

// Calculate running balances for transactions based on sort order
export const calculateTransactionBalances = (
  transactions: Transaction[],
  sortField: "date" | "createdAt" = "date",
  sortOrder: "asc" | "desc" = "desc"
): TransactionWithBalance[] => {
  // First, sort transactions according to the specified order
  const sortedTransactions = [...transactions].sort((a, b) => {
    let aValue: Date;
    let bValue: Date;

    if (sortField === "date") {
      aValue = a.date;
      bValue = b.date;
    } else {
      aValue = a.createdAt;
      bValue = b.createdAt;
    }

    const comparison = aValue.getTime() - bValue.getTime();
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Calculate running balance based on chronological order (oldest first for calculation)
  const chronologicalTransactions = [...transactions].sort((a, b) => {
    const aValue = sortField === "date" ? a.date : a.createdAt;
    const bValue = sortField === "date" ? b.date : b.createdAt;
    return aValue.getTime() - bValue.getTime(); // Always oldest first for balance calculation
  });

  // Calculate balances chronologically
  let runningBalance = 0;
  const balanceMap = new Map<string, number>();

  chronologicalTransactions.forEach(transaction => {
    // Debit increases what client owes, Credit decreases what client owes
    runningBalance = runningBalance + transaction.debitAmount - transaction.creditAmount;
    balanceMap.set(transaction.id, runningBalance);
  });

  // Apply calculated balances to the sorted transactions
  return sortedTransactions.map(transaction => ({
    ...transaction,
    balanceAfter: balanceMap.get(transaction.id) || 0,
  }));
};

export const createTransaction = async (
  userId: string,
  clientId: string,
  transactionData: InsertTransaction
): Promise<Transaction> => {
  try {
    console.log("Creating transaction for user:", userId, "client:", clientId);
    console.log("Transaction data:", transactionData);

    const transactionsRef = getTransactionsCollection(userId, clientId);
    const now = new Date();

    const debitAmount = transactionData.debitAmount || 0;
    const creditAmount = transactionData.creditAmount || 0;

    // Create transaction without storing balance (balance calculated on-the-fly)
    const transactionDoc = {
      ...transactionData,
      debitAmount: debitAmount,
      creditAmount: creditAmount,
      date: Timestamp.fromDate(transactionData.date),
      createdAt: Timestamp.fromDate(now),
    };

    console.log("Creating transaction document:", transactionDoc);

    const docRef = await addDoc(transactionsRef, transactionDoc);

    console.log("Transaction created with ID:", docRef.id);

    return {
      id: docRef.id,
      ...transactionData,
      debitAmount: debitAmount,
      creditAmount: creditAmount,
      createdAt: now,
    };
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

export const updateTransaction = async (
  userId: string,
  clientId: string,
  transactionId: string,
  transactionData: Partial<InsertTransaction>
): Promise<Transaction> => {
  try {
    console.log("Updating transaction:", transactionId, "with data:", transactionData);

    const transactionRef = doc(getTransactionsCollection(userId, clientId), transactionId);

    const updateData: any = {
      ...transactionData,
    };

    // Convert date to Timestamp if provided
    if (transactionData.date) {
      updateData.date = Timestamp.fromDate(transactionData.date);
    }

    await updateDoc(transactionRef, updateData);

    // Get the updated transaction
    const updatedDoc = await getDoc(transactionRef);
    const data = updatedDoc.data();

    if (!data) {
      throw new Error("Transaction not found after update");
    }

    return {
      id: transactionId,
      date: convertTimestamp(data.date),
      particulars: data.particulars,
      billNo: data.billNo || null,
      debitAmount: typeof data.debitAmount === 'number' ? data.debitAmount : parseFloat(data.debitAmount || "0"),
      creditAmount: typeof data.creditAmount === 'number' ? data.creditAmount : parseFloat(data.creditAmount || "0"),
      createdAt: convertTimestamp(data.createdAt),
    };
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

export const deleteTransaction = async (userId: string, clientId: string, transactionId: string): Promise<void> => {
  const transactionRef = doc(getTransactionsCollection(userId, clientId), transactionId);
  await deleteDoc(transactionRef);
};

// Balance calculation - calculates current balance based on all transactions
export const getClientBalance = async (userId: string, clientId: string): Promise<number> => {
  // Get all transactions for balance calculation (no pagination)
  const transactions = await getAllTransactions(userId, clientId);

  if (transactions.length === 0) return 0;

  // Calculate total balance: sum of all debits minus sum of all credits
  const totalDebit = transactions.reduce((sum: number, t: Transaction) => sum + t.debitAmount, 0);
  const totalCredit = transactions.reduce((sum: number, t: Transaction) => sum + t.creditAmount, 0);

  return totalDebit - totalCredit;
};

// Reports
export const getMonthlyTotals = async (
  userId: string,
  year: number,
  month: number
): Promise<MonthlyTotals> => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // Get all clients for this user
  const clients = await getClients(userId);

  let totalDebit = 0;
  let totalCredit = 0;
  let transactionCount = 0;

  // Get transactions for each client and aggregate
  for (const client of clients) {
    const result = await getTransactions(userId, client.id, {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      pageSize: 1000, // Large page size to get all transactions for the month
    });

    result.transactions.forEach((transaction: Transaction) => {
      totalDebit += transaction.debitAmount;
      totalCredit += transaction.creditAmount;
      transactionCount++;
    });
  }

  return {
    totalDebit,
    totalCredit,
    netAmount: totalCredit - totalDebit,
    transactionCount,
  };
};

// Real-time listeners
export const subscribeToClients = (
  userId: string,
  callback: (clients: Client[]) => void
) => {
  const clientsRef = getClientsCollection(userId);
  const q = query(clientsRef, orderBy("createdAt", "desc"));

  return onSnapshot(q, (querySnapshot) => {
    const clients = querySnapshot.docs.map(doc => ({
      id: doc.id,
      userId,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
    } as Client));

    callback(clients);
  });
};

export const subscribeToTransactions = (
  userId: string,
  clientId: string,
  callback: (transactions: Transaction[]) => void
) => {
  const transactionsRef = getTransactionsCollection(userId, clientId);
  const q = query(
    transactionsRef,
    orderBy("date", "desc")
  );

  return onSnapshot(q, (querySnapshot) => {
    const transactions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: convertTimestamp(data.date),
        particulars: data.particulars,
        billNo: data.billNo || null,
        debitAmount: typeof data.debitAmount === 'number' ? data.debitAmount : parseFloat(data.debitAmount || "0"),
        creditAmount: typeof data.creditAmount === 'number' ? data.creditAmount : parseFloat(data.creditAmount || "0"),
        createdAt: convertTimestamp(data.createdAt),
      } as Transaction;
    });

    callback(transactions);
  });
};

// Clean up old balance data from existing transactions (migration utility)
export const removeStoredBalances = async (userId: string, clientId: string): Promise<void> => {
  try {
    console.log("Removing stored balances for client:", clientId);

    const transactionsRef = getTransactionsCollection(userId, clientId);
    const querySnapshot = await getDocs(transactionsRef);

    const batch = writeBatch(db);

    querySnapshot.docs.forEach(doc => {
      // Remove the balanceAfter field from existing transactions
      batch.update(doc.ref, {
        balanceAfter: deleteField()
      });
    });

    await batch.commit();
    console.log("Stored balances removed for client:", clientId);
  } catch (error) {
    console.error("Error removing stored balances:", error);
    throw error;
  }
};
