import { useEffect, useRef, forwardRef } from "react";
import "@sajanm/nepali-date-picker/dist/nepali.datepicker.v5.0.6.min.css";
import "@sajanm/nepali-date-picker/dist/nepali.datepicker.v5.0.6.min.js";
import NepaliDate from 'nepali-date-converter';

// Define jQuery for TypeScript
declare global {
  interface Window {
    jQuery: any;
    $: any;
  }
}

interface NepaliDateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onNepaliDateChange?: (nepaliDate: { year: number; month: number; date: number; formattedDate: string }) => void;
  value?: string;
  className?: string;
}

const NepaliDateInput = forwardRef<HTMLInputElement, NepaliDateInputProps>(
  ({ onNepaliDateChange, value, className = "", ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    
    // Combine forwarded ref with local ref
    const setRefs = (element: HTMLInputElement | null) => {
      // Update the local ref
      inputRef.current = element;
      
      // Forward the ref
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    };

    useEffect(() => {
      if (inputRef.current && window.jQuery) {
        const $input = window.jQuery(inputRef.current);
        
        // Initialize the nepali date picker
        $input.nepaliDatePicker({
          ndpYear: true,
          ndpMonth: true,
          ndpYearCount: 10,
          onChange: function () {
            // Get the selected date
            const nepaliDateStr = $input.val();
            if (nepaliDateStr && onNepaliDateChange) {
              // Parse the date (format: YYYY-MM-DD)
              const dateParts = nepaliDateStr.split('-');
              if (dateParts.length === 3) {
                const year = parseInt(dateParts[0], 10);
                const month = parseInt(dateParts[1], 10) - 1; // 0-indexed month
                const date = parseInt(dateParts[2], 10);
                
                onNepaliDateChange({
                  year,
                  month,
                  date,
                  formattedDate: nepaliDateStr
                });
              }
            }
            
            // Trigger change event for React form integration
            const event = new Event('change', { bubbles: true });
            inputRef.current?.dispatchEvent(event);
          }
        });
        
        // Set initial value if provided
        if (value) {
          $input.val(value);
        }
      }
    }, [onNepaliDateChange]);

    return (
      <input
        ref={setRefs}
        type="text"
        placeholder="YYYY-MM-DD"
        className={`border p-2 rounded w-full ${className}`}
        readOnly // Prevent keyboard input, only picker selection
        {...props}
      />
    );
  }
);

NepaliDateInput.displayName = "NepaliDateInput";

export { NepaliDateInput };

// Utility function to convert AD date to BS date
export function convertADToBS(adDate: Date): { 
  year: number; 
  month: number; 
  date: number;
  formattedDate: string;
} {
  try {
    const nepaliDate = new NepaliDate(adDate);
    const bs = nepaliDate.getBS();
    
    // Format as YYYY-MM-DD
    const formattedDate = `${bs.year}-${(bs.month + 1).toString().padStart(2, '0')}-${bs.date.toString().padStart(2, '0')}`;
    
    return {
      year: bs.year,
      month: bs.month,
      date: bs.date,
      formattedDate
    };
  } catch (error) {
    console.error("Error converting AD to BS:", error);
    const today = new Date();
    return {
      year: 2080, // Default fallback year
      month: 0,   // Baisakh
      date: 1,
      formattedDate: "2080-01-01"
    };
  }
}

// Utility function to convert BS date to AD date
export function convertBSToAD(bsYear: number, bsMonth: number, bsDate: number): Date {
  try {
    const nepaliDate = new NepaliDate(bsYear, bsMonth, bsDate);
    return nepaliDate.toJsDate();
  } catch (error) {
    console.error("Error converting BS to AD:", error);
    return new Date(); // Return today as fallback
  }
}

export default NepaliDateInput;
