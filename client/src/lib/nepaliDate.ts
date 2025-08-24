import NepaliDate from 'nepali-date-converter';

// Nepali date interface
export interface NepaliDateType {
  year: number;
  month: number; // 0-11 (Baisakh = 0, Jestha = 1, etc.)
  date: number;  // 1-32
}

// Nepali month names
export const NEPALI_MONTHS = [
  { value: 0, label: 'Baisakh', labelNp: 'बैशाख' },
  { value: 1, label: 'Jestha', labelNp: 'जेठ' },
  { value: 2, label: 'Asar', labelNp: 'आषाढ' },
  { value: 3, label: 'Shrawan', labelNp: 'श्रावण' },
  { value: 4, label: 'Bhadra', labelNp: 'भाद्र' },
  { value: 5, label: 'Aswin', labelNp: 'आश्विन' },
  { value: 6, label: 'Kartik', labelNp: 'कार्तिक' },
  { value: 7, label: 'Mangsir', labelNp: 'मंसिर' },
  { value: 8, label: 'Poush', labelNp: 'पौष' },
  { value: 9, label: 'Magh', labelNp: 'माघ' },
  { value: 10, label: 'Falgun', labelNp: 'फाल्गुण' },
  { value: 11, label: 'Chaitra', labelNp: 'चैत्र' }
];

// Get current Nepali date
export const getCurrentNepaliDate = (): NepaliDateType => {
  try {
    const now = new NepaliDate();
    return {
      year: now.getYear(),
      month: now.getMonth(),
      date: now.getDate()
    };
  } catch (error) {
    // Fallback to default year 2082 if there's an issue
    console.warn('Error getting current Nepali date, using fallback:', error);
    return {
      year: DEFAULT_NEPALI_YEAR,
      month: 0, // Baisakh
      date: 1
    };
  }
};

// Convert English date to Nepali date
export const englishToNepali = (englishDate: Date): NepaliDateType => {
  try {
    const nepaliDate = NepaliDate.fromAD(englishDate);
    return {
      year: nepaliDate.getYear(),
      month: nepaliDate.getMonth(),
      date: nepaliDate.getDate()
    };
  } catch (error) {
    console.warn('Error converting English to Nepali date, using fallback:', error);
    return getCurrentNepaliDate();
  }
};

// Convert Nepali date to English date
export const nepaliToEnglish = (nepaliDate: NepaliDateType): Date => {
  try {
    const nepali = new NepaliDate(nepaliDate.year, nepaliDate.month, nepaliDate.date);
    return nepali.toJsDate();
  } catch (error) {
    console.warn('Error converting Nepali to English date, using current date:', error);
    return new Date();
  }
};

// Format Nepali date for display
export const formatNepaliDate = (nepaliDate: NepaliDateType, includeDay = false): string => {
  const monthName = NEPALI_MONTHS[nepaliDate.month].label;
  const formatted = `${nepaliDate.date} ${monthName} ${nepaliDate.year}`;
  
  if (includeDay) {
    const nepali = new NepaliDate(nepaliDate.year, nepaliDate.month, nepaliDate.date);
    return nepali.format('ddd, DD MMMM YYYY');
  }
  
  return formatted;
};

// Get days in a Nepali month (helper for date picker)
export const getDaysInNepaliMonth = (year: number, month: number): number => {
  const nepaliDate = new NepaliDate(year, month, 1);
  // Get the last day of the month by going to next month and subtracting a day
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  
  try {
    // Try to create the last possible day (32) and see if it's valid
    for (let day = 32; day >= 28; day--) {
      try {
        new NepaliDate(year, month, day);
        return day;
      } catch {
        continue;
      }
    }
    return 30; // fallback
  } catch {
    return 30; // fallback
  }
};

// Validate Nepali date
export const isValidNepaliDate = (year: number, month: number, date: number): boolean => {
  try {
    new NepaliDate(year, month, date);
    return true;
  } catch {
    return false;
  }
};

// Generate year options (from 2070 to 2090)
export const getYearOptions = (): { value: number; label: string }[] => {
  const years = [];
  for (let year = 2070; year <= 2090; year++) {
    years.push({ value: year, label: year.toString() });
  }
  return years;
};

// Generate date options for a given month/year
export const getDateOptions = (year: number, month: number): { value: number; label: string }[] => {
  const daysInMonth = getDaysInNepaliMonth(year, month);
  const dates = [];
  for (let date = 1; date <= daysInMonth; date++) {
    dates.push({ value: date, label: date.toString() });
  }
  return dates;
};

// Convert stored English date to Nepali for display
export const displayDateAsNepali = (englishDate: Date): string => {
  const nepaliDate = englishToNepali(englishDate);
  return formatNepaliDate(nepaliDate);
};

// Default year for new transactions
export const DEFAULT_NEPALI_YEAR = 2082;
