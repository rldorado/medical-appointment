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
import { createLogger } from "@/utils/logger";
import { 
  handleError, 
  handleApiError, 
  createNetworkError 
} from "@/utils/errorHandler";

const logger = createLogger({ module: 'AppointmentService', showTimestamp: true });

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
    logger.info(`Fetching slots for date: ${date}`);
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.WEEKLY_SLOTS}${date}`;
    logger.debug(`API URL: ${url}`);
    
    const response = await fetch(url).catch(error => {
      throw createNetworkError('Failed to connect to the server', error);
    });
    
    if (!response.ok) {
      await handleApiError(response, 'getWeeklySlots');
    }
    
    const data = await response.json();
    logger.debug('API response received', data);
    
    // Ensure data is properly formatted
    if (!Array.isArray(data)) {
      logger.warn('API response is not an array, converting to array format');
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
    handleError(error, 'getWeeklySlots');
    throw error; // Re-throw for component-level handling
  }
};

/**
 * Book a slot
 * @param bookingData Booking request data
 * @returns Promise with booking response
 */
export const bookSlot = async (bookingData: BookingRequest): Promise<BookingResponse> => {
  try {
    logger.info('Booking slot', { start: bookingData.Start, end: bookingData.End });
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOK_SLOT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    }).catch(error => {
      throw createNetworkError('Failed to connect to the server', error);
    });
    
    // Check if response is ok
    if (!response.ok) {
      await handleApiError(response, 'bookSlot');
    }
    
    // Check if response is empty
    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      logger.info('Empty response from server, assuming success');
      return {
        success: true,
        message: 'Appointment rescheduled successfully'
      };
    }
    
    // Try to parse JSON
    try {
      const data = JSON.parse(responseText);
      logger.debug('Booking response received', data);
      return data;
    } catch (parseError) {
      logger.error('Error parsing JSON response', parseError);
      // Return a default success response since the HTTP status was OK
      return {
        success: true,
        message: 'Appointment rescheduled successfully (response not in JSON format)'
      };
    }
  } catch (error) {
    handleError(error, 'bookSlot');
    throw error; // Re-throw for component-level handling
  }
};
