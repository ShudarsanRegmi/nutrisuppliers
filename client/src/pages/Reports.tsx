import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getMonthlyTotals } from "@/lib/firebaseDb";
import { MonthlyTotals } from "@/lib/firebaseTypes";

export default function Reports() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: monthlyTotals, isLoading } = useQuery<MonthlyTotals>({
    queryKey: ["reports", "monthly", user?.id, selectedYear, selectedMonth],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      return await getMonthlyTotals(user.id, parseInt(selectedYear), parseInt(selectedMonth));
    },
    enabled: !!user?.id,
  });

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <h2 className="text-2xl font-bold text-gray-900" data-testid="text-reports-title">Financial Reports</h2>
          
          <div className="flex space-x-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32" data-testid="select-month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((month, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24" data-testid="select-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 mb-8">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Credits</p>
                      <p className="text-2xl font-bold text-success" data-testid="text-total-credits">
                        {monthlyTotals ? formatAmount(monthlyTotals.totalCredit) : '₹0'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center">
                      <TrendingUp className="text-white" size={20} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Money received</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Debits</p>
                      <p className="text-2xl font-bold text-error" data-testid="text-total-debits">
                        {monthlyTotals ? formatAmount(monthlyTotals.totalDebit) : '₹0'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-error rounded-full flex items-center justify-center">
                      <TrendingDown className="text-white" size={20} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Money paid</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Net Balance</p>
                      <p className="text-2xl font-bold text-primary" data-testid="text-net-balance">
                        {monthlyTotals ? formatAmount(monthlyTotals.netAmount) : '₹0'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <BarChart3 className="text-white" size={20} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Chart implementation coming soon</p>
                <p className="text-sm text-gray-400 mt-2">
                  This will show monthly credit/debit trends using Chart.js or Recharts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
