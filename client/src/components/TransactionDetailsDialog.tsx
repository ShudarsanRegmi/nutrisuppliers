import { Calendar, FileText, CreditCard, Building2, Clock, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TransactionWithBalance } from "@/lib/firebaseTypes";
import { displayDateAsNepali } from "@/lib/nepaliDate";

interface TransactionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionWithBalance | null;
  onEdit: (transaction: TransactionWithBalance) => void;
  onDelete: (transactionId: string) => void;
}

export default function TransactionDetailsDialog({
  open,
  onOpenChange,
  transaction,
  onEdit,
  onDelete,
}: TransactionDetailsDialogProps) {
  if (!transaction) return null;

  const isCredit = transaction.creditAmount > 0;
  const amount = isCredit ? transaction.creditAmount : transaction.debitAmount;

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Math.abs(balance));
  };

  const formatDate = (date: Date) => {
    return displayDateAsNepali(date);
  };

  const formatDateTime = (date: Date) => {
    return displayDateAsNepali(date);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return formatDateTime(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 pr-12">
          <DialogTitle className="flex items-center justify-between text-lg">
            <span>Transaction Details</span>
            <Badge
              variant={isCredit ? "default" : "destructive"}
              className={isCredit ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
            >
              {isCredit ? "Credit" : "Debit"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Complete information about this transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-700">Amount</span>
              </div>
              <span className={`text-2xl font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                {formatBalance(amount)}
              </span>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-700">Particulars</p>
                <p className="text-gray-900">{transaction.particulars}</p>
              </div>
            </div>

            {transaction.billNo && (
              <div className="flex items-start space-x-3">
                <Building2 className="h-5 w-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-700">Bill Number</p>
                  <p className="text-gray-900">{transaction.billNo}</p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-700">Transaction Date (BS)</p>
                <p className="text-gray-900">{formatDate(transaction.date)}</p>
                <p className="font-medium text-gray-700 text-sm mt-2">Transaction Date (AD)</p>
                <p className="text-gray-600 text-sm">{transaction.date.toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-700">Created On (BS)</p>
                <p className="text-gray-900">{formatDateTime(transaction.createdAt)}</p>
                <p className="font-medium text-gray-700 text-sm mt-2">Created On (AD)</p>
                <p className="text-gray-600 text-sm">{transaction.createdAt.toLocaleDateString()} {transaction.createdAt.toLocaleTimeString()}</p>
                <p className="text-sm text-gray-500 mt-1">{formatTimeAgo(transaction.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Balance Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-700">Balance Due After Transaction</span>
              </div>
              <div className="text-right">
                <span className={`text-xl font-bold ${
                  transaction.balanceAfter > 0 ? 'text-red-600' : 
                  transaction.balanceAfter < 0 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {formatBalance(transaction.balanceAfter)}
                </span>
                <p className="text-sm text-gray-600">
                  {transaction.balanceAfter > 0 && "(Client owes)"}
                  {transaction.balanceAfter < 0 && "(Client overpaid)"}
                  {transaction.balanceAfter === 0 && "(Settled)"}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(transaction);
                onOpenChange(false);
              }}
              className="flex-1 h-12 text-sm sm:text-base"
            >
              <Edit className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Edit Transaction</span>
              <span className="sm:hidden">Edit</span>
            </Button>
            <Button
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(transaction.id);
                onOpenChange(false);
              }}
              className="flex-1 h-12 text-sm sm:text-base"
            >
              <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Delete Transaction</span>
              <span className="sm:hidden">Delete</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
