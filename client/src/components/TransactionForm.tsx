import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { InsertTransaction, TransactionWithBalance } from "@/lib/firebaseTypes";
import CustomNepaliDateInput from "@/components/CustomNepaliDateInput";
import { 
  NepaliDateType, 
  nepaliToEnglish, 
  englishToNepali, 
  getCurrentNepaliDate,
  DEFAULT_NEPALI_YEAR
} from "@/lib/nepaliDate";

const transactionFormSchema = z.object({
  nepaliDate: z.object({
    year: z.number(),
    month: z.number(),
    date: z.number(),
  }),
  particulars: z.string().min(1, "Particulars is required"),
  billNo: z.string().optional(),
  clientId: z.string().optional(),
  type: z.enum(["credit", "debit"]),
  amount: z.string().min(1, "Amount is required"),
});

type TransactionFormData = z.infer<typeof transactionFormSchema>;

interface TransactionFormProps {
  onSubmit: (data: InsertTransaction) => void;
  isLoading?: boolean;
  defaultValues?: Partial<TransactionFormData>;
  clientId?: string | null;
  editTransaction?: TransactionWithBalance | null;
  mode?: "create" | "edit";
}

export default function TransactionForm({
  onSubmit,
  isLoading = false,
  defaultValues,
  clientId,
  editTransaction,
  mode = "create"
}: TransactionFormProps) {

  // Use a static default for initial form values
  const staticDefaultNepaliDate: NepaliDateType = {
    year: DEFAULT_NEPALI_YEAR,
    month: 0, // Baisakh
    date: 1
  };

  // Prepare default values for edit mode
  const getDefaultValues = (): TransactionFormData => {
    if (mode === "edit" && editTransaction) {
      const isCredit = editTransaction.creditAmount > 0;
      const amount = isCredit ? editTransaction.creditAmount : editTransaction.debitAmount;

      return {
        nepaliDate: englishToNepali(editTransaction.date),
        particulars: editTransaction.particulars,
        billNo: editTransaction.billNo || "",
        type: isCredit ? "credit" as const : "debit" as const,
        amount: amount.toString(),
      };
    }

    const baseDefaults: TransactionFormData = {
      nepaliDate: staticDefaultNepaliDate,
      particulars: "",
      billNo: "",
      type: "credit" as const,
      amount: "",
    };

    if (defaultValues) {
      return {
        ...baseDefaults,
        ...defaultValues,
      };
    }

    return baseDefaults;
  };

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: getDefaultValues(),
  });

  const handleSubmit = (data: TransactionFormData) => {
    if (!clientId) {
      console.error("No client selected");
      return;
    }

    const amount = parseFloat(data.amount);
    const transactionData: InsertTransaction = {
      date: nepaliToEnglish(data.nepaliDate),
      particulars: data.particulars,
      billNo: data.billNo || undefined,
      debitAmount: data.type === "debit" ? amount : 0,
      creditAmount: data.type === "credit" ? amount : 0,
      nepaliDate: data.nepaliDate,
    };

    console.log("Submitting transaction with clientId:", clientId);
    
    onSubmit(transactionData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nepaliDate"
          render={({ field, fieldState }) => (
            <CustomNepaliDateInput
              value={field.value}
              onChange={field.onChange}
              label="Date (Nepali)"
              error={fieldState.error?.message}
              disabled={isLoading}
            />
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
                  <SelectItem value="credit">Credit - Payment Received</SelectItem>
                  <SelectItem value="debit">Debit - Product/Service Given</SelectItem>
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
            {isLoading
              ? (mode === "edit" ? "Updating..." : "Adding...")
              : (mode === "edit" ? "Update Transaction" : "Add Transaction")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
