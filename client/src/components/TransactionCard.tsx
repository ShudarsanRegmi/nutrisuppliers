import { useState } from "react";
import { ChevronDown, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Transaction {
  id: number;
  date: string;
  particulars: string;
  billNo: string;
  debitAmount: string;
  creditAmount: string;
  balanceAfter: string;
}

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete: (transactionId: number) => void;
}

export default function TransactionCard({ transaction, onEdit, onDelete }: TransactionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return num === 0 ? "-" : `₹${num.toLocaleString()}`;
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

  const isCredit = parseFloat(transaction.creditAmount) > 0;
  const isDebit = parseFloat(transaction.debitAmount) > 0;
  const amount = isCredit ? transaction.creditAmount : transaction.debitAmount;

  return (
    <Card className="overflow-hidden" data-testid={`card-transaction-${transaction.id}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <p className="font-medium text-gray-900" data-testid={`text-particulars-${transaction.id}`}>
              {transaction.particulars}
            </p>
            <p className="text-sm text-gray-500 mt-1" data-testid={`text-date-bill-${transaction.id}`}>
              {formatDate(transaction.date)} • Bill: {transaction.billNo || "N/A"}
            </p>
          </div>
          <div className="text-right ml-4">
            <p 
              className={`font-bold text-lg ${isCredit ? 'text-success' : 'text-error'}`}
              data-testid={`text-amount-${transaction.id}`}
            >
              {isCredit ? '+' : '-'}{formatAmount(amount)}
            </p>
            <p className="text-sm text-gray-500" data-testid={`text-balance-${transaction.id}`}>
              Bal: {formatBalance(transaction.balanceAfter)}
            </p>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div className="flex space-x-4">
            {onEdit && (
              <Button 
                variant="ghost" 
                size="sm"
                className="text-primary hover:text-primary-dark p-0"
                onClick={() => onEdit(transaction)}
                data-testid={`button-edit-${transaction.id}`}
              >
                <Edit size={16} />
                <span className="ml-1 text-sm">Edit</span>
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              className="text-error hover:text-red-700 p-0"
              onClick={() => onDelete(transaction.id)}
              data-testid={`button-delete-${transaction.id}`}
            >
              <Trash2 size={16} />
              <span className="ml-1 text-sm">Delete</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid={`button-expand-${transaction.id}`}
          >
            <ChevronDown 
              size={16} 
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            />
          </Button>
        </div>
      </CardContent>
      
      {/* Expandable Details */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4" data-testid={`details-${transaction.id}`}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Transaction Type:</span>
              <p className={`font-medium ${isCredit ? 'text-success' : 'text-error'}`}>
                {isCredit ? 'Credit' : 'Debit'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Running Balance:</span>
              <p className="font-medium">{formatBalance(transaction.balanceAfter)}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
