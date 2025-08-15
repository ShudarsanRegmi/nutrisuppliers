import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, TrendingUp, Plus, ArrowRight, Package, Stethoscope, Pill } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getClients, getAllTransactions } from "@/lib/firebaseDb";
import { useAuth } from "@/hooks/useAuth";

interface DashboardProps {
  onNavigate: (view: 'clients' | 'ledger' | 'reports') => void;
  onClientSelect: (clientId: string) => void;
}

export default function Dashboard({ onNavigate, onClientSelect }: DashboardProps) {
  const { user } = useAuth();

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ["clients", user?.id],
    queryFn: () => user?.id ? getClients(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
  });

  // Fetch recent transactions
  const { data: allTransactions = [] } = useQuery({
    queryKey: ["allTransactions", user?.id],
    queryFn: () => user?.id ? getAllTransactions(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
  });

  // Calculate stats
  const totalClients = clients.length;
  const totalTransactions = allTransactions.length;
  const totalBalance = clients.reduce((sum, client) => sum + (client.balance || 0), 0);
  const recentTransactions = allTransactions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Math.abs(balance));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Stethoscope className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Nutri Suppliers</h1>
            <p className="text-gray-600">Your Digital Medical Supply Ledger</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Package className="text-blue-600" size={20} />
            <p className="text-blue-800 text-sm">
              Manage your medical supply transactions digitally. Track clients, record sales, and monitor payments efficiently.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('clients')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Active medical suppliers & pharmacies
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('ledger')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Sales & payment records
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('reports')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalBalance > 0 ? 'text-red-600' : totalBalance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
              {formatBalance(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalBalance > 0 ? 'Amount receivable' : totalBalance < 0 ? 'Advance payments' : 'All settled'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => onNavigate('clients')} 
              className="w-full justify-start"
              variant="outline"
            >
              <Users className="h-4 w-4 mr-2" />
              Add New Client
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
            <Button 
              onClick={() => onNavigate('ledger')} 
              className="w-full justify-start"
              variant="outline"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Record Transaction
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
            <Button 
              onClick={() => onNavigate('reports')} 
              className="w-full justify-start"
              variant="outline"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Reports
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Transactions</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onNavigate('ledger')}
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => {
                  const isCredit = transaction.creditAmount > 0;
                  const amount = isCredit ? transaction.creditAmount : transaction.debitAmount;
                  
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${isCredit ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="text-sm font-medium truncate max-w-32">
                            {transaction.particulars}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                          {isCredit ? '+' : '-'}{formatBalance(amount)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Pill className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No transactions yet</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => onNavigate('ledger')}
                >
                  Add First Transaction
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Clients */}
      {clients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Clients</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onNavigate('clients')}
              >
                Manage All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.slice(0, 6).map((client) => (
                <div 
                  key={client.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onClientSelect(client.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{client.name}</p>
                      <p className="text-xs text-gray-500">
                        {client.transactionCount || 0} transactions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        (client.balance || 0) > 0 ? 'text-red-600' : 
                        (client.balance || 0) < 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {formatBalance(client.balance || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
