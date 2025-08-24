import { useState } from "react";
import { ChevronDown, ChevronUp, Edit, Trash2, Phone, Mail, MapPin, Calendar, FileText, CreditCard, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TransactionWithBalance } from "@/lib/firebaseTypes";
import { displayDateAsNepali } from "@/lib/nepaliDate";

interface TransactionCardProps {
  transaction: TransactionWithBalance;
  onEdit: (transaction: TransactionWithBalance) => void;
  onDelete: (transactionId: string) => void;
  onRowClick?: (transaction: TransactionWithBalance) => void;
}

export default function TransactionCard({ transaction, onEdit, onDelete, onRowClick }: TransactionCardProps) {
  const [tapCount, setTapCount] = useState(0);
  const [tapTimer, setTapTimer] = useState<NodeJS.Timeout | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTapFeedback, setShowTapFeedback] = useState(false);

  const formatAmount = (amount: number) => {
    return amount === 0 ? "-" : `₹${amount.toLocaleString()}`;
  };

  const formatBalance = (balance: number) => {
    return `₹${balance.toLocaleString()}`;
  };

  const formatDate = (date: Date) => {
    return displayDateAsNepali(date);
  };

  const isCredit = transaction.creditAmount > 0;
  const isDebit = transaction.debitAmount > 0;
  const amount = isCredit ? transaction.creditAmount : transaction.debitAmount;

  const handleCardClick = () => {
    setTapCount(prev => prev + 1);
    setShowTapFeedback(true);

    if (tapTimer) {
      clearTimeout(tapTimer);
    }

    const timer = setTimeout(() => {
      if (tapCount === 0) {
        // Single tap - show feedback
        setShowTapFeedback(false);
      } else if (tapCount === 1) {
        // Double tap - show details
        onRowClick?.(transaction);
        setShowTapFeedback(false);
      }
      setTapCount(0);
    }, 300);

    setTapTimer(timer);

    // Hide feedback after a short delay
    setTimeout(() => setShowTapFeedback(false), 200);
  };

  // Determine card background color based on transaction type
  // Credit = payment received (good) = green, Debit = product taken without payment (concerning) = red
  const cardBgClass = isCredit
    ? "bg-green-50 border-green-200"
    : "bg-red-50 border-red-200";

  return (
    <Card
      className={`overflow-hidden ${cardBgClass} cursor-pointer transition-all duration-200 hover:shadow-md ${showTapFeedback ? 'ring-2 ring-blue-300 shadow-lg' : ''}`}
      data-testid={`card-transaction-${transaction.id}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate" data-testid={`text-particulars-${transaction.id}`}>
              {transaction.particulars}
            </p>
            <p className="text-sm text-gray-500 mt-1" data-testid={`text-date-bill-${transaction.id}`}>
              {formatDate(transaction.date)} • {transaction.billNo || "N/A"}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <div className="text-right">
              <p
                className={`font-bold text-lg ${isCredit ? 'text-green-600' : 'text-red-600'}`}
                data-testid={`text-amount-${transaction.id}`}
              >
                {isCredit ? '+' : '-'}{formatAmount(amount)}
              </p>
              <p className="text-xs text-gray-500">
                {isCredit ? 'Credit' : 'Debit'}
              </p>
            </div>
            {/* Expand Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </CardContent>
      
      {/* Expandable Details */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-3" data-testid={`details-${transaction.id}`}>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-500">
                <CreditCard className="h-4 w-4 mr-2" />
                <span>Balance After:</span>
              </div>
              <p className={`font-medium ${transaction.balanceAfter > 0 ? 'text-red-600' : transaction.balanceAfter < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                {formatBalance(transaction.balanceAfter)}
                {transaction.balanceAfter > 0 && <span className="text-xs ml-1">(Owes)</span>}
                {transaction.balanceAfter < 0 && <span className="text-xs ml-1">(Overpaid)</span>}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Created:</span>
              </div>
              <p className="font-medium">{formatDate(transaction.createdAt)}</p>
            </div>
          </div>

          {/* Action Buttons - Only in Expanded View */}
          <div className="flex space-x-3 mt-4 pt-3 border-t border-gray-200 justify-center" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(transaction);
              }}
              className="text-blue-600 border-blue-200 hover:bg-blue-50 p-3 min-w-[44px] h-11"
              data-testid={`button-edit-${transaction.id}`}
              title="Edit Transaction"
            >
              <Edit size={18} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(transaction.id);
              }}
              className="text-red-600 border-red-200 hover:bg-red-50 p-3 min-w-[44px] h-11"
              data-testid={`button-delete-${transaction.id}`}
              title="Delete Transaction"
            >
              <Trash2 size={18} />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
