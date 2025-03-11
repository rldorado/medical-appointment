/**
 * Appointment Service
 * 
 * This service handles all API interactions related to appointments,
 * including fetching available slots and booking appointments.
 */
import type { BookingRequest, BookingResponse } from "@/types/Booking";
import type { WeeklySlots, Slot } from "@/types/Slot";
import { 
  formatDateToYYYYMMDD, 
  getNextSevenDays 
} from "@/utils/dateUtils";
import { API_CONFIG } from "@/config/api";

/**
 * Group slots by date
 * @param slots Array of slots from API
 * @returns Record with dates as keys and arrays of slots as values
 */
const groupSlotsByDate = (slots: any[]): Record<string, Slot[]> => {
  return slots.reduce((acc: Record<string, Slot[]>, slot: any) => {
    // Extract date from Start (format: 2025-03-03T09:00:00)
    const date = slot.Start ? slot.Start.split('T')[0] : '';
    
    if (!acc[date]) {
      acc[date] = [];
    }
    
    acc[date].push({
      start: slot.Start || '',
      end: slot.End || '',
      available: !slot.Taken
    });
    
    return acc;
  }, {});
};

/**
 * Fetch weekly slots from the API
 * @param date Date in yyyyMMdd format
 * @returns Promise with weekly slots
 */
export const getWeeklySlots = async (date: string): Promise<WeeklySlots[]> => {
  try {
    console.log(`Fetching slots for date: ${date}`);
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.WEEKLY_SLOTS}${date}`;
    console.log(`API URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error ${response.status}: ${errorText}`);
      throw new Error(`API error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('API response:', data);
    
    // Ensure data is properly formatted
    if (!Array.isArray(data)) {
      console.warn('API response is not an array, converting to array format');
      // Convert single object to array
      const dataArray = [data];
      
      // Group slots by date
      const groupedByDate = groupSlotsByDate(dataArray);
      
      // Generate slots for all 7 days of the week
      // Parse the date string to a Date object
      const startDate = new Date(
        parseInt(date.substring(0, 4)),
        parseInt(date.substring(4, 6)) - 1,
        parseInt(date.substring(6, 8))
      );
      
      // Get the next 7 days
      const weekDates = getNextSevenDays(startDate);
      
      // Map dates to WeeklySlots format
      return weekDates.map(date => {
        const dateStr = formatDateToYYYYMMDD(date);
        return {
          date: dateStr,
          slots: groupedByDate[dateStr] || []
        };
      });
    }
    
    // Group slots by date
    const groupedByDate = groupSlotsByDate(data);
    
    // Generate slots for all 7 days of the week
    // Parse the date string to a Date object
    const startDate = new Date(
      parseInt(date.substring(0, 4)),
      parseInt(date.substring(4, 6)) - 1,
      parseInt(date.substring(6, 8))
    );
    
    // Get the next 7 days
    const weekDates = getNextSevenDays(startDate);
    
    // Map dates to WeeklySlots format
    return weekDates.map(date => {
      const dateStr = formatDateToYYYYMMDD(date);
      return {
        date: dateStr,
        slots: groupedByDate[dateStr] || []
      };
    });
  } catch (error) {
    console.error('Error fetching weekly slots:', error);
    throw error;
  }
};

/**
 * Book a slot
 * @param bookingData Booking request data
 * @returns Promise with booking response
 */
export const bookSlot = async (bookingData: BookingRequest): Promise<BookingResponse> => {
  try {
    console.log('Booking slot with data:', bookingData);
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOK_SLOT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error ${response.status}: ${errorText}`);
      throw new Error(`API error ${response.status}: ${errorText}`);
    }
    
    // Check if response is empty
    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      console.log('Empty response from server, assuming success');
      return {
        success: true,
        message: 'Appointment rescheduled successfully'
      };
    }
    
    // Try to parse JSON
    try {
      const data = JSON.parse(responseText);
      console.log('Booking response:', data);
      return data;
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      // Return a default success response since the HTTP status was OK
      return {
        success: true,
        message: 'Appointment rescheduled successfully (response not in JSON format)'
      };
    }
  } catch (error) {
    console.error('Error booking slot:', error);
    throw error;
  }
};
