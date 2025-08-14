import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import ClientForm from "@/components/ClientForm";

interface Client {
  id: number;
  name: string;
  contact: string;
  email: string;
  address: string;
  balance: string;
  transactionCount: number;
  lastActivity: string;
}

interface ClientManagementProps {
  onClientSelect: (clientId: number) => void;
}

export default function ClientManagement({ onClientSelect }: ClientManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["/api/clients"],
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

  const createClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      const response = await apiRequest("POST", "/api/clients", clientData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Client added successfully",
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
        description: "Failed to add client",
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

  const formatBalance = (balance: string) => {
    const numBalance = parseFloat(balance);
    return numBalance >= 0 ? `₹${numBalance.toLocaleString()}` : `₹${Math.abs(numBalance).toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
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
              onClick={() => onClientSelect(client.id)}
              data-testid={`card-client-${client.id}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-medium" data-testid={`text-initials-${client.id}`}>
                    {getInitials(client.name)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">Balance</span>
                  <p 
                    className={`font-bold text-lg ${parseFloat(client.balance) >= 0 ? 'balance-positive' : 'balance-negative'}`}
                    data-testid={`text-balance-${client.id}`}
                  >
                    {formatBalance(client.balance)}
                  </p>
                </div>
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2" data-testid={`text-name-${client.id}`}>
                {client.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4" data-testid={`text-contact-${client.id}`}>
                {client.contact}
              </p>
              <div className="flex justify-between text-sm text-gray-500">
                <span data-testid={`text-transaction-count-${client.id}`}>
                  {client.transactionCount} transactions
                </span>
                <span data-testid={`text-last-activity-${client.id}`}>
                  {formatDate(client.lastActivity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
