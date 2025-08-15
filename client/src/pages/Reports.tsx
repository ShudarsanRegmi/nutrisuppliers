import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, BarChart3, Users, DollarSign, Calendar, Download, Filter, PieChart as PieChartIcon, Activity, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getMonthlyTotals, getClients, getAllTransactions, getClientBalance } from "@/lib/firebaseDb";
import { MonthlyTotals, TransactionWithClient } from "@/lib/firebaseTypes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

export default function Reports() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("3months");
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  // Fetch all data for comprehensive analytics
  const { data: clients = [] } = useQuery({
    queryKey: ["clientsWithStats", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const clientsData = await getClients(user.id);
      const clientsWithStats = await Promise.all(
        clientsData.map(async (client) => {
          const balance = await getClientBalance(user.id, client.id);
          const transactions = await getAllTransactions(user.id, client.id, "createdAt", "desc");
          return {
            ...client,
            balance,
            transactionCount: transactions.length,
            lastActivity: transactions.length > 0 ? transactions[0].createdAt : null,
          };
        })
      );
      return clientsWithStats;
    },
    enabled: !!user?.id,
  });

  const { data: allTransactions = [] } = useQuery<TransactionWithClient[]>({
    queryKey: ["allTransactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const clientsData = await getClients(user.id);
      const allTransactionsPromises = clientsData.map(async (client) => {
        const transactions = await getAllTransactions(user.id, client.id, "createdAt", "desc");
        // Add client info to each transaction
        return transactions.map(transaction => ({
          ...transaction,
          clientName: client.name,
          clientId: client.id
        }));
      });

      const transactionArrays = await Promise.all(allTransactionsPromises);
      const flatTransactions = transactionArrays.flat();

      return flatTransactions.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !!user?.id,
  });

  // Calculate comprehensive analytics data
  const analyticsData = useMemo(() => {
    const now = new Date();
    const getDateRange = (months: number) => {
      const startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - months);
      return startDate;
    };

    const rangeMap = {
      "1month": getDateRange(1),
      "3months": getDateRange(3),
      "6months": getDateRange(6),
      "1year": getDateRange(12),
    };

    const startDate = rangeMap[timeRange as keyof typeof rangeMap];
    const filteredTransactions = allTransactions.filter(
      t => new Date(t.createdAt) >= startDate
    );

    // Monthly revenue trend data
    const monthlyData = {};
    filteredTransactions.forEach(transaction => {
      const month = new Date(transaction.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short'
      });

      if (!monthlyData[month]) {
        monthlyData[month] = { month, revenue: 0, expenses: 0, transactions: 0, net: 0 };
      }

      if (transaction.creditAmount > 0) {
        monthlyData[month].revenue += transaction.creditAmount;
        monthlyData[month].net += transaction.creditAmount;
      } else {
        monthlyData[month].expenses += transaction.debitAmount;
        monthlyData[month].net -= transaction.debitAmount;
      }
      monthlyData[month].transactions += 1;
    });

    const monthlyChartData = Object.values(monthlyData).sort((a: any, b: any) =>
      new Date(a.month + " 1").getTime() - new Date(b.month + " 1").getTime()
    );

    // Client performance data
    const clientPerformance = clients.map(client => ({
      name: client.name.length > 15 ? client.name.substring(0, 15) + '...' : client.name,
      fullName: client.name,
      balance: Math.abs(client.balance || 0),
      transactions: client.transactionCount || 0,
      status: (client.balance || 0) > 0 ? 'Owes' : (client.balance || 0) < 0 ? 'Overpaid' : 'Settled',
    })).sort((a, b) => b.balance - a.balance).slice(0, 10);

    // Transaction type distribution
    const totalCredits = filteredTransactions.reduce((sum, t) => sum + t.creditAmount, 0);
    const totalDebits = filteredTransactions.reduce((sum, t) => sum + t.debitAmount, 0);

    const transactionTypeData = [
      { name: 'Payments Received', value: totalCredits, color: '#10B981' },
      { name: 'Sales/Services', value: totalDebits, color: '#EF4444' },
    ];

    // Outstanding balances
    const outstandingData = clients.filter(c => (c.balance || 0) !== 0).map(client => ({
      name: client.name.length > 12 ? client.name.substring(0, 12) + '...' : client.name,
      amount: Math.abs(client.balance || 0),
      type: (client.balance || 0) > 0 ? 'Receivable' : 'Payable',
    })).sort((a, b) => b.amount - a.amount).slice(0, 8);

    // Key metrics
    const totalRevenue = totalCredits;
    const totalOutstanding = clients.reduce((sum, c) => sum + Math.max(0, c.balance || 0), 0);
    const totalOverpaid = clients.reduce((sum, c) => sum + Math.abs(Math.min(0, c.balance || 0)), 0);
    const activeClients = clients.filter(c => (c.transactionCount || 0) > 0).length;

    return {
      monthlyChartData,
      clientPerformance,
      transactionTypeData,
      outstandingData,
      metrics: {
        totalRevenue,
        totalOutstanding,
        totalOverpaid,
        activeClients,
        totalClients: clients.length,
        totalTransactions: filteredTransactions.length,
      }
    };
  }, [clients, allTransactions, timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-2">Business insights for Nutri Suppliers</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(analyticsData.metrics.totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-green-600" size={20} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Payments received</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(analyticsData.metrics.totalOutstanding)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="text-red-600" size={20} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Amount receivable</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Clients</p>
                <p className="text-2xl font-bold text-blue-600">
                  {analyticsData.metrics.activeClients}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="text-blue-600" size={20} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              of {analyticsData.metrics.totalClients} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Transactions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analyticsData.metrics.totalTransactions}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Activity className="text-purple-600" size={20} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">In selected period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Monthly Revenue Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.3}
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.3}
                    name="Expenses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="h-5 w-5" />
              <span>Transaction Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.transactionTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.transactionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Performance and Outstanding Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Clients by Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Top Clients by Outstanding Balance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.clientPerformance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Balance']}
                    labelFormatter={(label) => `Client: ${label}`}
                  />
                  <Bar dataKey="balance" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Balances */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Outstanding Balances</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.outstandingData.length > 0 ? (
                analyticsData.outstandingData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        item.type === 'Receivable' ? 'bg-red-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${
                        item.type === 'Receivable' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">All balances are settled!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Transaction Volume */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Monthly Transaction Volume</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [value, 'Transactions']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="transactions"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  name="Transaction Count"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
