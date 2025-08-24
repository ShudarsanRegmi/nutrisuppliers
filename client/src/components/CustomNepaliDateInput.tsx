import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  NepaliDateType, 
  NEPALI_MONTHS, 
  getYearOptions, 
  getDateOptions, 
  DEFAULT_NEPALI_YEAR,
  isValidNepaliDate,
  getCurrentNepaliDate 
} from "@/lib/nepaliDate";

interface CustomNepaliDateInputProps {
  value?: NepaliDateType;
  onChange: (date: NepaliDateType) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: {
    year?: string;
    month?: string;
    date?: string;
  };
}

export default function CustomNepaliDateInput({
  value,
  onChange,
  label = "Date",
  error,
  disabled = false,
  placeholder = {
    year: "Select year",
    month: "Select month", 
    date: "Select date"
  }
}: CustomNepaliDateInputProps) {
  // Initialize with static defaults
  const [selectedYear, setSelectedYear] = useState<number>(value?.year || DEFAULT_NEPALI_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number>(value?.month || 0);
  const [selectedDate, setSelectedDate] = useState<number>(value?.date || 1);

  // Set current date on mount if no value provided
  useEffect(() => {
    if (!value) {
      try {
        const currentDate = getCurrentNepaliDate();
        setSelectedYear(currentDate.year);
        setSelectedMonth(currentDate.month);
        setSelectedDate(currentDate.date);
        onChange(currentDate);
      } catch (error) {
        console.warn('Could not set current Nepali date:', error);
        // Keep the static defaults
        onChange({ year: DEFAULT_NEPALI_YEAR, month: 0, date: 1 });
      }
    }
  }, []);

  // Update local state when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedYear(value.year);
      setSelectedMonth(value.month);
      setSelectedDate(value.date);
    }
  }, [value]);

  // Get available dates based on selected year and month
  const availableDates = getDateOptions(selectedYear, selectedMonth);

  // Handle year change
  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr);
    setSelectedYear(year);
    
    // If all values are selected, validate and update
    if (isValidNepaliDate(year, selectedMonth, selectedDate)) {
      onChange({ year, month: selectedMonth, date: selectedDate });
    } else {
      // Reset date to 1 if invalid
      setSelectedDate(1);
      onChange({ year, month: selectedMonth, date: 1 });
    }
  };

  // Handle month change
  const handleMonthChange = (monthStr: string) => {
    const month = parseInt(monthStr);
    setSelectedMonth(month);
    
    // If all values are selected, validate and update
    if (isValidNepaliDate(selectedYear, month, selectedDate)) {
      onChange({ year: selectedYear, month, date: selectedDate });
    } else {
      // Reset date to 1 if invalid
      setSelectedDate(1);
      onChange({ year: selectedYear, month, date: 1 });
    }
  };

  // Handle date change
  const handleDateChange = (dateStr: string) => {
    const date = parseInt(dateStr);
    setSelectedDate(date);
    
    // Update the full date
    onChange({ year: selectedYear, month: selectedMonth, date });
  };

  const yearOptions = getYearOptions();

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <div className="grid grid-cols-3 gap-2">
        {/* Year Selection */}
        <FormControl>
          <Select
            value={selectedYear.toString()}
            onValueChange={handleYearChange}
            disabled={disabled}
          >
            <SelectTrigger data-testid="select-nepali-year">
              <SelectValue placeholder={placeholder.year} />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year.value} value={year.value.toString()}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormControl>

        {/* Month Selection */}
        <FormControl>
          <Select
            value={selectedMonth.toString()}
            onValueChange={handleMonthChange}
            disabled={disabled}
          >
            <SelectTrigger data-testid="select-nepali-month">
              <SelectValue placeholder={placeholder.month} />
            </SelectTrigger>
            <SelectContent>
              {NEPALI_MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormControl>

        {/* Date Selection */}
        <FormControl>
          <Select
            value={selectedDate.toString()}
            onValueChange={handleDateChange}
            disabled={disabled}
          >
            <SelectTrigger data-testid="select-nepali-date">
              <SelectValue placeholder={placeholder.date} />
            </SelectTrigger>
            <SelectContent>
              {availableDates.map((date) => (
                <SelectItem key={date.value} value={date.value.toString()}>
                  {date.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormControl>
      </div>
      {error && <FormMessage>{error}</FormMessage>}
    </FormItem>
  );
}
