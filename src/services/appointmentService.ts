import type { BookingRequest, BookingResponse } from "@/types/Booking";
import type { WeeklySlots } from "@/types/Slot";

const API_BASE_URL = 'https://draliatest.azurewebsites.net/api/availability';

/**
 * Fetch weekly slots from the API
 * @param date Date in yyyyMMdd format
 * @returns Promise with weekly slots
 */
export const getWeeklySlots = async (date: string): Promise<WeeklySlots[]> => {
  try {
    console.log(`Fetching slots for date: ${date}`);
    const url = `${API_BASE_URL}/GetWeeklySlots/${date}`;
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
      return [data];
    }
    
    // Validate and sanitize the response data
    // Each element is an available slot with "Start" and "End" times.
    const groupedByDate = data.reduce((acc: Record<string, any[]>, slot: any) => {
      // Extract date from Start (format: 2025-03-03T09:00:00)
      const date = slot.Start ? slot.Start.split('T')[0] : '';
      
      if (!acc[date]) {
        acc[date] = [];
      }
      
      acc[date].push({
        start: slot.Start || '',
        end: slot.End || '',
        available: true
      });
      
      return acc;
    }, {});
    
    // Turn to WeeklySlots
    return Object.entries(groupedByDate).map(([date, slots]) => ({
      date,
      slots
    }));
  } catch (error) {
    console.error('Error fetching weekly slots:', error);
    throw error;
  }
}

/**
 * Book a slot
 * @param bookingData Booking request data
 * @returns Promise with booking response
 */
export const bookSlot = async (bookingData: BookingRequest): Promise<BookingResponse> => {
  try {
    console.log('Booking slot with data:', bookingData);
    const response = await fetch(`${API_BASE_URL}/BookSlot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error ${response.status}: ${errorText}`);
      throw new Error(`API error ${response.status}: ${errorText}`);
    }
    
    // Check if response is empty (Success)
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
}
