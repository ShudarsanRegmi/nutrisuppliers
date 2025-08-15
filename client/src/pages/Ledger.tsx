import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import TransactionForm from "@/components/TransactionForm";
import TransactionCard from "@/components/TransactionCard";
import {
  getClients,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  calculateTransactionBalances
} from "@/lib/firebaseDb";
import { Transaction, TransactionWithBalance, Client, InsertTransaction } from "@/lib/firebaseTypes";

interface LedgerProps {
  selectedClientId: string | null;
  onClientSelect: (clientId: string | null) => void;
}

type SortField = "date" | "createdAt";
type SortOrder = "asc" | "desc";

export default function Ledger({ selectedClientId, onClientSelect }: LedgerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithBalance | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionType, setTransactionType] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["clients", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await getClients(user.id);
    },
    enabled: !!user?.id,
  });

  const { data: rawTransactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions", user?.id, selectedClientId, { searchTerm, transactionType, startDate, endDate }],
    queryFn: async () => {
      if (!user?.id || !selectedClientId) return [];

      return await getTransactions(user.id, selectedClientId, {
        searchTerm: searchTerm || undefined,
        transactionType: transactionType as "all" | "debit" | "credit",
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
    },
    enabled: !!user?.id && !!selectedClientId,
  });

  // Calculate balances on-the-fly based on current sort order
  const transactions: TransactionWithBalance[] = calculateTransactionBalances(
    rawTransactions,
    sortField,
    sortOrder
  );

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: InsertTransaction) => {
      if (!user?.id || !selectedClientId) throw new Error("User not authenticated or no client selected");
      return await createTransaction(user.id, selectedClientId, transactionData);
    },
    onSuccess: () => {
      // Invalidate all transaction queries for this user and client
      queryClient.invalidateQueries({
        queryKey: ["transactions", user?.id, selectedClientId],
        exact: false
      });
      // Invalidate client queries to update balances
      queryClient.invalidateQueries({
        queryKey: ["clients", user?.id],
        exact: false
      });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
      console.log("Transaction mutation successful, queries invalidated");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add transaction",
        variant: "destructive",
      });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async (transactionData: InsertTransaction) => {
      if (!user?.id || !selectedClientId || !editingTransaction) {
        throw new Error("User not authenticated, no client selected, or no transaction to edit");
      }
      return await updateTransaction(user.id, selectedClientId, editingTransaction.id, transactionData);
    },
    onSuccess: () => {
      // Invalidate all transaction queries for this user and client
      queryClient.invalidateQueries({
        queryKey: ["transactions", user?.id, selectedClientId],
        exact: false
      });
      // Invalidate client queries to update balances
      queryClient.invalidateQueries({
        queryKey: ["clients", user?.id],
        exact: false
      });
      setIsEditDialogOpen(false);
      setEditingTransaction(null);
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update transaction",
        variant: "destructive",
      });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      if (!user?.id || !selectedClientId) throw new Error("User not authenticated or no client selected");
      return await deleteTransaction(user.id, selectedClientId, transactionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id, selectedClientId] });
      queryClient.invalidateQueries({ queryKey: ["clients", user?.id] });
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    },
  });

  const formatAmount = (amount: number) => {
    return amount === 0 ? "-" : `₹${amount.toLocaleString()}`;
  };

  const formatBalance = (balance: number) => {
    return `₹${balance.toLocaleString()}`;
  };

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new field with default desc order
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === "asc"
      ? <ArrowUp className="h-4 w-4 text-primary" />
      : <ArrowDown className="h-4 w-4 text-primary" />;
  };

  const handleEditTransaction = (transaction: TransactionWithBalance) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  if (!selectedClientId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Select a Client</h2>
            <p className="text-gray-600">Choose a client to view their transaction ledger</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedClient = clients.find((c: Client) => c.id === selectedClientId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Client Selection & Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900" data-testid="text-ledger-title">Transaction Ledger</h2>
              <Select 
                value={selectedClientId?.toString() || ""} 
                onValueChange={(value) => onClientSelect(parseInt(value))}
              >
                <SelectTrigger className="w-48" data-testid="select-client">
                  <SelectValue placeholder="Select Client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client: Client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search transactions..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-transactions"
                />
              </div>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger className="w-32" data-testid="select-transaction-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Controls */}
              <div className="flex space-x-2">
                <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
                  <SelectTrigger className="w-40" data-testid="select-sort-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Transaction Date</SelectItem>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="px-3"
                  data-testid="button-sort-order"
                >
                  {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-24 animate-pulse"></div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-600 mb-4">
              {selectedClient?.name} has no transactions yet. Add the first transaction to get started.
            </p>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary-dark" data-testid="button-add-first-transaction">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Transaction</DialogTitle>
                  <DialogDescription>
                    Record a new transaction for this client.
                  </DialogDescription>
                </DialogHeader>
                <TransactionForm
                  onSubmit={(data) => createTransactionMutation.mutate(data)}
                  isLoading={createTransactionMutation.isPending}
                  clientId={selectedClientId}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          {!isMobile && (
            <Card className="overflow-hidden">
              {/* Sort status for desktop */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
                  </span>
                  <span>
                    Sorted by {sortField === "date" ? "Transaction Date" : "Created Date"}
                    ({sortOrder === "asc" ? "Oldest first" : "Newest first"})
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Balance Due calculated chronologically: Debit (+) = Product/Service given, Credit (-) = Payment received
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort("date")}
                          className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                          data-testid="sort-date"
                        >
                          <span>Date</span>
                          {getSortIcon("date")}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Particulars</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill No</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance Due</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort("createdAt")}
                          className="flex items-center space-x-1 hover:text-gray-700 transition-colors justify-center"
                          data-testid="sort-created"
                        >
                          <span>Created</span>
                          {getSortIcon("createdAt")}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction: TransactionWithBalance) => {
                      const isCredit = transaction.creditAmount > 0;
                      const rowBgClass = isCredit
                        ? "bg-green-50 hover:bg-green-100"
                        : "bg-red-50 hover:bg-red-100";

                      return (
                        <tr key={transaction.id} className={`${rowBgClass}`} data-testid={`row-transaction-${transaction.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`text-date-${transaction.id}`}>
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900" data-testid={`text-particulars-${transaction.id}`}>
                          {transaction.particulars}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`text-bill-${transaction.id}`}>
                          {transaction.billNo || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 text-right" data-testid={`text-debit-${transaction.id}`}>
                          {formatAmount(transaction.debitAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right" data-testid={`text-credit-${transaction.id}`}>
                          {formatAmount(transaction.creditAmount)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${transaction.balanceAfter > 0 ? 'text-red-600' : transaction.balanceAfter < 0 ? 'text-green-600' : 'text-gray-600'}`} data-testid={`text-balance-${transaction.id}`}>
                          {formatBalance(transaction.balanceAfter)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" data-testid={`text-created-${transaction.id}`}>
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex space-x-2 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTransaction(transaction)}
                              className="text-blue-600 hover:text-blue-700"
                              data-testid={`button-edit-${transaction.id}`}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTransactionMutation.mutate(transaction.id)}
                              className="text-error hover:text-red-700"
                              data-testid={`button-delete-${transaction.id}`}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Mobile Card View */}
          {isMobile && (
            <div className="space-y-4">
              {/* Sort indicator for mobile */}
              <div className="flex items-center justify-between text-sm text-gray-500 px-2">
                <span>
                  Sorted by {sortField === "date" ? "Transaction Date" : "Created Date"}
                  ({sortOrder === "asc" ? "Oldest first" : "Newest first"})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="px-2"
                >
                  {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </Button>
              </div>

              {transactions.map((transaction: TransactionWithBalance) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={handleEditTransaction}
                  onDelete={() => deleteTransactionMutation.mutate(transaction.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Floating Action Button (Mobile) */}
      {isMobile && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg fab hover:bg-primary-dark transition-colors flex items-center justify-center z-40"
              data-testid="button-fab-add-transaction"
            >
              <Plus size={24} />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
              <DialogDescription>
                Record a new transaction for this client.
              </DialogDescription>
            </DialogHeader>
            <TransactionForm
              onSubmit={(data) => createTransactionMutation.mutate(data)}
              isLoading={createTransactionMutation.isPending}
              clientId={selectedClientId}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Desktop Add Button */}
      {!isMobile && selectedClientId && (
        <div className="mt-6 flex justify-center">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-primary text-white hover:bg-primary-dark"
                data-testid="button-add-transaction"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>
                  Record a new transaction for this client.
                </DialogDescription>
              </DialogHeader>
              <TransactionForm
                onSubmit={(data) => createTransactionMutation.mutate(data)}
                isLoading={createTransactionMutation.isPending}
                clientId={selectedClientId}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update the transaction details.
            </DialogDescription>
          </DialogHeader>
          <TransactionForm
            onSubmit={(data) => updateTransactionMutation.mutate(data)}
            isLoading={updateTransactionMutation.isPending}
            clientId={selectedClientId}
            editTransaction={editingTransaction}
            mode="edit"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
