import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import TransactionForm from "@/components/TransactionForm";
import TransactionCard from "@/components/TransactionCard";

interface Transaction {
  id: number;
  date: string;
  particulars: string;
  billNo: string;
  debitAmount: string;
  creditAmount: string;
  balanceAfter: string;
  clientId: number;
}

interface Client {
  id: number;
  name: string;
}

interface LedgerProps {
  selectedClientId: number | null;
  onClientSelect: (clientId: number | null) => void;
}

export default function Ledger({ selectedClientId, onClientSelect }: LedgerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionType, setTransactionType] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/clients", selectedClientId, "transactions", { searchTerm, transactionType, startDate, endDate }],
    enabled: !!selectedClientId,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (transactionType !== 'all') params.append('type', transactionType);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/clients/${selectedClientId}/transactions?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      const response = await apiRequest("POST", `/api/clients/${selectedClientId}/transactions`, transactionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", selectedClientId, "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const response = await apiRequest("DELETE", `/api/transactions/${transactionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", selectedClientId, "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    },
  });

  const formatAmount = (amount: string) => {
    return parseFloat(amount) === 0 ? "-" : `₹${parseFloat(amount).toLocaleString()}`;
  };

  const formatBalance = (balance: string) => {
    const numBalance = parseFloat(balance);
    return `₹${numBalance.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
                </DialogHeader>
                <TransactionForm 
                  onSubmit={(data) => createTransactionMutation.mutate(data)}
                  isLoading={createTransactionMutation.isPending}
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Particulars</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill No</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction: Transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50" data-testid={`row-transaction-${transaction.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`text-date-${transaction.id}`}>
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900" data-testid={`text-particulars-${transaction.id}`}>
                          {transaction.particulars}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`text-bill-${transaction.id}`}>
                          {transaction.billNo || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-error text-right" data-testid={`text-debit-${transaction.id}`}>
                          {formatAmount(transaction.debitAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-success text-right" data-testid={`text-credit-${transaction.id}`}>
                          {formatAmount(transaction.creditAmount)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${parseFloat(transaction.balanceAfter) >= 0 ? 'balance-positive' : 'balance-negative'}`} data-testid={`text-balance-${transaction.id}`}>
                          {formatBalance(transaction.balanceAfter)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTransactionMutation.mutate(transaction.id)}
                            className="text-error hover:text-red-700"
                            data-testid={`button-delete-${transaction.id}`}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Mobile Card View */}
          {isMobile && (
            <div className="space-y-4">
              {transactions.map((transaction: Transaction) => (
                <TransactionCard 
                  key={transaction.id}
                  transaction={transaction}
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
            </DialogHeader>
            <TransactionForm 
              onSubmit={(data) => createTransactionMutation.mutate(data)}
              isLoading={createTransactionMutation.isPending}
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
              </DialogHeader>
              <TransactionForm 
                onSubmit={(data) => createTransactionMutation.mutate(data)}
                isLoading={createTransactionMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
