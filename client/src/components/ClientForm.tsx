import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";

type ClientFormData = z.infer<typeof insertClientSchema>;

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => void;
  isLoading?: boolean;
  defaultValues?: Partial<ClientFormData>;
}

export default function ClientForm({ onSubmit, isLoading = false, defaultValues }: ClientFormProps) {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: "",
      contact: "",
      email: "",
      address: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (data: ClientFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Company or individual name" 
                  {...field} 
                  data-testid="input-client-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Number</FormLabel>
              <FormControl>
                <Input 
                  placeholder="+91 98765 43210" 
                  {...field} 
                  data-testid="input-client-contact"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="client@example.com" 
                  {...field} 
                  data-testid="input-client-email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Client address" 
                  rows={3} 
                  {...field} 
                  data-testid="input-client-address"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex space-x-3 pt-4">
          <Button 
            type="submit" 
            className="flex-1 bg-primary text-white hover:bg-primary-dark"
            disabled={isLoading}
            data-testid="button-submit-client"
          >
            {isLoading ? "Adding..." : "Add Client"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
