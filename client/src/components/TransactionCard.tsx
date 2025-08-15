import { useState } from "react";
import { ChevronDown, Edit, Trash2, Phone, Mail, MapPin, Calendar, FileText, CreditCard, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TransactionWithBalance } from "@/lib/firebaseTypes";

interface TransactionCardProps {
  transaction: TransactionWithBalance;
  onEdit: (transaction: TransactionWithBalance) => void;
  onDelete: (transactionId: string) => void;
}

export default function TransactionCard({ transaction, onEdit, onDelete }: TransactionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatAmount = (amount: number) => {
    return amount === 0 ? "-" : `₹${amount.toLocaleString()}`;
  };

  const formatBalance = (balance: number) => {
    return `₹${balance.toLocaleString()}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isCredit = transaction.creditAmount > 0;
  const isDebit = transaction.debitAmount > 0;
  const amount = isCredit ? transaction.creditAmount : transaction.debitAmount;

  // Determine card background color based on transaction type
  // Credit = payment received (good) = green, Debit = product taken without payment (concerning) = red
  const cardBgClass = isCredit
    ? "bg-green-50 border-green-200"
    : "bg-red-50 border-red-200";

  return (
    <Card className={`overflow-hidden ${cardBgClass}`} data-testid={`card-transaction-${transaction.id}`}>
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
            <div className="flex items-center text-sm text-gray-500" data-testid={`text-balance-${transaction.id}`}>
              <CreditCard className="h-4 w-4 mr-1" />
              <span>Balance Due: {formatBalance(transaction.balanceAfter)}</span>
              {transaction.balanceAfter > 0 && <span className="text-red-600 ml-1">(Owes)</span>}
              {transaction.balanceAfter < 0 && <span className="text-green-600 ml-1">(Overpaid)</span>}
            </div>
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
              <div className="flex items-center text-gray-500 mb-1">
                <Building2 className="h-4 w-4 mr-1" />
                <span>Transaction Type:</span>
              </div>
              <p className={`font-medium ${isCredit ? 'text-success' : 'text-error'}`}>
                {isCredit ? 'Credit' : 'Debit'}
              </p>
            </div>
            <div>
              <div className="flex items-center text-gray-500 mb-1">
                <CreditCard className="h-4 w-4 mr-1" />
                <span>Balance Due:</span>
              </div>
              <p className="font-medium">{formatBalance(transaction.balanceAfter)}</p>
            </div>
            <div>
              <div className="flex items-center text-gray-500 mb-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Created:</span>
              </div>
              <p className="font-medium">{formatDate(transaction.createdAt)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-200 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(transaction)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50 p-2"
              data-testid={`button-edit-${transaction.id}`}
              title="Edit Transaction"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
                  onDelete(transaction.id);
                }
              }}
              className="text-red-600 border-red-200 hover:bg-red-50 p-2"
              data-testid={`button-delete-${transaction.id}`}
              title="Delete Transaction"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
