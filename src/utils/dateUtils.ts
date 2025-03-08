/**
 * Format date to yyyyMMdd format for API calls
 * Always returns a Monday date as required by the API
 * @param date Date to format
 * @returns Formatted date string for a Monday (yyyyMMdd)
 */
export const formatDateForApi = (date: Date): string => {
  const mondayDate = getMondayOfWeek(date);
  
  const year = mondayDate.getFullYear();
  const month = String(mondayDate.getMonth() + 1).padStart(2, '0');
  const day = String(mondayDate.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Format date to display format (e.g., Friday, May 21)
 * @param dateStr Date string
 * @returns Formatted date string
 */
export const formatDateForDisplay = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format time to display format (e.g., 10:30)
 * @param dateTimeStr Date time string
 * @returns Formatted time string
 */
export const formatTimeForDisplay = (dateTimeStr: string): string => {
  const date = new Date(dateTimeStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get the next 7 days starting from a given date
 * @param startDate Starting date
 * @returns Array of dates
 */
export const getNextSevenDays = (startDate: Date = new Date()): Date[] => {
  const dates: Date[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  
  return dates;
}

/**
 * Check if a date is today
 * @param date Date to check
 * @returns True if date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Get the week start date (first day of the week)
 * @param date Date within the week
 * @param startOnMonday Whether week starts on Monday (true) or Sunday (false)
 * @returns Date representing the first day of the week
 */
export const getWeekStartDate = (date: Date, startOnMonday: boolean = false): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = startOnMonday ? (day === 0 ? 6 : day - 1) : day;
  result.setDate(result.getDate() - diff);
  return result;
}

/**
 * Get the Monday of the week for a given date
 * @param date Date to get the Monday for
 * @returns Date representing the Monday of the week
 */
export const getMondayOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? 6 : day - 1; // If Sunday (0), then it's 6 days from Monday, otherwise day - 1
  result.setDate(result.getDate() - diff);
  return result;
}
