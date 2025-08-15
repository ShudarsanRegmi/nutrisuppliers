import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema } from "@/lib/firebaseTypes";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building2, User, Phone, Mail, MapPin, FileText } from "lucide-react";
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
      companyName: "",
      contactPerson: "",
      contact: "",
      email: "",
      address: "",
      panNumber: "",
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
              <FormLabel className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Display Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="How this client should be displayed"
                  {...field}
                  data-testid="input-client-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <Building2 className="h-4 w-4 mr-2" />
                  Company Name (Optional)
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="ABC Pharmaceuticals Ltd."
                    {...field}
                    value={field.value || ""}
                    data-testid="input-company-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Contact Person (Optional)
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    {...field}
                    value={field.value || ""}
                    data-testid="input-contact-person"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contact"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Number
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="+977 98765 43210"
                    {...field}
                    value={field.value || ""}
                    data-testid="input-client-contact"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="panNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  PAN Number (Optional)
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="123456789"
                    {...field}
                    value={field.value || ""}
                    data-testid="input-pan-number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Email (Optional)
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="client@example.com"
                  {...field}
                  value={field.value || ""}
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
              <FormLabel className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Address (Optional)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Complete address with city and postal code"
                  rows={3}
                  {...field}
                  value={field.value || ""}
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
