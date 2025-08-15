import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Phone, Mail, MapPin, Building2, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import ClientForm from "@/components/ClientForm";
import {
  getClients,
  createClient,
  getClientBalance,
  getAllTransactions,
  removeStoredBalances
} from "@/lib/firebaseDb";
import { Client, InsertClient } from "@/lib/firebaseTypes";

interface ClientWithStats extends Client {
  balance: number;
  transactionCount: number;
  lastActivity: Date;
}

interface ClientManagementProps {
  onClientSelect: (clientId: string) => void;
}

export default function ClientManagement({ onClientSelect }: ClientManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: clients = [], isLoading } = useQuery<ClientWithStats[]>({
    queryKey: ["clients", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const clientsData = await getClients(user.id);

      // Add balance and transaction count to each client
      const clientsWithStats = await Promise.all(
        clientsData.map(async (client) => {
          const balance = await getClientBalance(user.id, client.id);
          const transactions = await getAllTransactions(user.id, client.id, "createdAt", "desc");
          return {
            ...client,
            balance,
            transactionCount: transactions.length,
            lastActivity: transactions.length > 0 ? transactions[0].createdAt : client.createdAt,
          };
        })
      );

      return clientsWithStats;
    },
    enabled: !!user?.id,
  });

  const createClientMutation = useMutation({
    mutationFn: async (clientData: InsertClient) => {
      if (!user?.id) throw new Error("User not authenticated");
      return await createClient(user.id, clientData);
    },
    onSuccess: () => {
      // Invalidate all client-related queries
      queryClient.invalidateQueries({
        queryKey: ["clients"],
        exact: false
      });
      queryClient.invalidateQueries({
        queryKey: ["clientBalance"],
        exact: false
      });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Client added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add client",
        variant: "destructive",
      });
    },
  });

  const cleanupBalancesMutation = useMutation({
    mutationFn: async (clientId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      return await removeStoredBalances(user.id, clientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", user?.id] });
      toast({
        title: "Success",
        description: "Old balance data cleaned up successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cleanup balance data",
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatBalance = (balance: number) => {
    return balance >= 0 ? `₹${balance.toLocaleString()}` : `₹${Math.abs(balance).toLocaleString()}`;
  };

  const formatDate = (date: Date | undefined | null) => {
    if (!date) return "No activity";

    const now = new Date();
    const dateObj = date instanceof Date ? date : new Date(date);
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.ceil(diffDays / 30)} month${Math.ceil(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-48"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900" data-testid="text-client-management-title">Client Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-primary text-white hover:bg-primary-dark transition-colors flex items-center space-x-2"
              data-testid="button-add-client"
            >
              <Plus size={16} />
              <span>Add Client</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Add a new client to your digital ledger. Fill in the client details below.
              </DialogDescription>
            </DialogHeader>
            <ClientForm 
              onSubmit={(data) => createClientMutation.mutate(data)}
              isLoading={createClientMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clients</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first client.</p>
          <div className="mt-6">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary text-white hover:bg-primary-dark"
                  data-testid="button-add-first-client"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client: Client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover cursor-pointer"
              onClick={() => {
                console.log("Client selected from card:", client.id, "type:", typeof client.id);
                onClientSelect(client.id);
              }}
              data-testid={`card-client-${client.id}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-medium" data-testid={`text-initials-${client.id}`}>
                    {getInitials(client.name)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">Balance Due</span>
                  <p
                    className={`font-bold text-lg ${(client.balance || 0) > 0 ? 'text-red-600' : (client.balance || 0) < 0 ? 'text-green-600' : 'text-gray-600'}`}
                    data-testid={`text-balance-${client.id}`}
                  >
                    {formatBalance(client.balance || 0)}
                  </p>
                </div>
              </div>
              <div className="mb-2">
                <h3 className="font-semibold text-lg text-gray-900" data-testid={`text-name-${client.id}`}>
                  {client.name}
                </h3>
                {client.companyName && (
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Building2 className="h-4 w-4 mr-1" />
                    <span>{client.companyName}</span>
                  </div>
                )}
                {client.contactPerson && (
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <User className="h-4 w-4 mr-1" />
                    <span>Contact: {client.contactPerson}</span>
                  </div>
                )}
                {client.panNumber && (
                  <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mt-2 w-fit">
                    <FileText className="h-3 w-3 mr-1" />
                    <span>PAN: {client.panNumber}</span>
                  </div>
                )}
              </div>
              <div className="text-gray-600 text-sm mb-4 space-y-1">
                {client.contact && (
                  <div className="flex items-center" data-testid={`text-contact-${client.id}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{client.contact}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center" data-testid={`text-email-${client.id}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center" data-testid={`text-address-${client.id}`}>
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{client.address}</span>
                  </div>
                )}
                {!client.contact && !client.email && !client.address && (
                  <p className="text-gray-400 italic">No contact details</p>
                )}
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex flex-col">
                  <span data-testid={`text-transaction-count-${client.id}`}>
                    {client.transactionCount || 0} transactions
                  </span>
                  <span data-testid={`text-last-activity-${client.id}`}>
                    {client.lastActivity ? formatDate(client.lastActivity) : "No activity"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    cleanupBalancesMutation.mutate(client.id);
                  }}
                  disabled={cleanupBalancesMutation.isPending}
                  className="text-xs"
                  title="Remove old stored balance data"
                >
                  Cleanup
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
