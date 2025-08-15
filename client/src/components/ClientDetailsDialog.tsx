import { Building2, User, Phone, Mail, MapPin, FileText, Edit, Calendar, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Client } from "@/lib/firebaseTypes";

interface ClientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onEdit: (client: Client) => void;
  onSelect?: (clientId: string) => void;
}

export default function ClientDetailsDialog({
  open,
  onOpenChange,
  client,
  onEdit,
  onSelect,
}: ClientDetailsDialogProps) {
  if (!client) return null;

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Math.abs(balance));
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Client Details</span>
            <Badge 
              variant={
                (client.balance || 0) > 0 ? "destructive" : 
                (client.balance || 0) < 0 ? "default" : "secondary"
              }
            >
              {(client.balance || 0) > 0 ? "Owes Money" : 
               (client.balance || 0) < 0 ? "Overpaid" : "Settled"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Complete information about this client
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Balance Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-700">Current Balance Due</span>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${
                  (client.balance || 0) > 0 ? 'text-red-600' : 
                  (client.balance || 0) < 0 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {formatBalance(client.balance || 0)}
                </span>
                <p className="text-sm text-gray-600">
                  {(client.balance || 0) > 0 && "(Client owes)"}
                  {(client.balance || 0) < 0 && "(Client overpaid)"}
                  {(client.balance || 0) === 0 && "(All settled)"}
                </p>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-700">Display Name</p>
                <p className="text-gray-900 text-lg">{client.name}</p>
              </div>
            </div>

            {client.companyName && (
              <div className="flex items-start space-x-3">
                <Building2 className="h-5 w-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-700">Company Name</p>
                  <p className="text-gray-900">{client.companyName}</p>
                </div>
              </div>
            )}

            {client.contactPerson && (
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-700">Contact Person</p>
                  <p className="text-gray-900">{client.contactPerson}</p>
                </div>
              </div>
            )}

            {client.contact && (
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-700">Phone Number</p>
                  <p className="text-gray-900">{client.contact}</p>
                </div>
              </div>
            )}

            {client.email && (
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-700">Email Address</p>
                  <p className="text-gray-900">{client.email}</p>
                </div>
              </div>
            )}

            {client.address && (
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-700">Address</p>
                  <p className="text-gray-900">{client.address}</p>
                </div>
              </div>
            )}

            {client.panNumber && (
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-700">PAN Number</p>
                  <p className="text-gray-900">{client.panNumber}</p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-700">Client Since</p>
                <p className="text-gray-900">{formatDateTime(client.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Transaction Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-700">Transaction Summary</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-blue-600">
                  {client.transactionCount || 0}
                </span>
                <p className="text-sm text-blue-600">
                  Total transactions
                </p>
              </div>
            </div>
            {client.lastActivity && (
              <div className="mt-2 text-sm text-blue-600">
                Last activity: {formatDateTime(client.lastActivity)}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t space-y-2">
            {onSelect && (
              <Button
                onClick={() => {
                  onSelect(client.id);
                  onOpenChange(false);
                }}
                className="w-full"
                variant="default"
              >
                Select Client for Ledger
              </Button>
            )}
            <Button
              onClick={() => {
                onEdit(client);
                onOpenChange(false);
              }}
              className="w-full"
              variant="outline"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Client Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
