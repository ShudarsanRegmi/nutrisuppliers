import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransactionSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";

const transactionFormSchema = insertTransactionSchema.extend({
  type: z.enum(["credit", "debit"]),
  amount: z.string().min(1, "Amount is required"),
}).omit({
  debitAmount: true,
  creditAmount: true,
});

type TransactionFormData = z.infer<typeof transactionFormSchema>;

interface TransactionFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  defaultValues?: Partial<TransactionFormData>;
}

export default function TransactionForm({ onSubmit, isLoading = false, defaultValues }: TransactionFormProps) {
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      particulars: "",
      billNo: "",
      type: "credit",
      amount: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (data: TransactionFormData) => {
    const amount = parseFloat(data.amount);
    const transactionData = {
      date: data.date,
      particulars: data.particulars,
      billNo: data.billNo,
      debitAmount: data.type === "debit" ? amount.toString() : "0",
      creditAmount: data.type === "credit" ? amount.toString() : "0",
      clientId: data.clientId,
    };
    
    onSubmit(transactionData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  {...field} 
                  data-testid="input-transaction-date"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="particulars"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Particulars</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Description of transaction" 
                  {...field} 
                  data-testid="input-transaction-particulars"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="billNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bill Number</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Invoice/Bill number" 
                  {...field} 
                  data-testid="input-transaction-bill"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-transaction-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="credit">Credit (+)</SelectItem>
                  <SelectItem value="debit">Debit (-)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  {...field} 
                  data-testid="input-transaction-amount"
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
            data-testid="button-submit-transaction"
          >
            {isLoading ? "Adding..." : "Add Transaction"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
