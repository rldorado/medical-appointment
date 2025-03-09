/**
 * Appointment Store
 * 
 * Manages the current appointment state.
 * Following the single responsibility principle, this store only handles
 * the current appointment data and its related actions.
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { BookingRequest } from '@/types/Booking';
import { formatDateForDisplay, formatTimeForDisplay } from '@/utils/dateUtils';
import { bookSlot } from '@/services/appointmentService';
import { CURRENT_APPOINTMENT, CURRENT_PATIENT } from '@/config/mockData';

export const useAppointmentStore = defineStore('appointment', () => {
  // State
  const currentAppointment = ref({ ...CURRENT_APPOINTMENT });
  const isRescheduling = ref(false);
  const isReschedulingSpinner = ref(false);
  const errorMessage = ref('');
  
  // Actions
  function clearError() {
    errorMessage.value = '';
  }
  
  async function rescheduleAppointment(slot: { start: string; end: string }) {
    if (!slot) return;
    
    isRescheduling.value = true;
    isReschedulingSpinner.value = true;
    errorMessage.value = '';
    
    try {
      const bookingData: BookingRequest = {
        Start: slot.start,
        End: slot.end,
        Comments: '',
        Patient: CURRENT_PATIENT
      };
      
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await bookSlot(bookingData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to reschedule appointment');
      }
      
      updateAppointment(slot);
      
      return true;
    } catch (error) {
      console.error('Failed to reschedule appointment:', error);
      errorMessage.value = error instanceof Error 
        ? error.message 
        : 'Failed to reschedule appointment. Please try again.';
      return false;
    } finally {
      isRescheduling.value = false;
      isReschedulingSpinner.value = false;
    }
  }

  function updateAppointment(slot: { start: string; end: string }) {
    const newDate = new Date(slot.start);
    currentAppointment.value = {
      ...currentAppointment.value,
      date: newDate,
      formattedDate: `${formatDateForDisplay(slot.start)} at ${formatTimeForDisplay(slot.start)}`
    };
  }

  return {
    // State
    currentAppointment,
    isRescheduling,
    isReschedulingSpinner,
    errorMessage,
    // Actions
    clearError,
    rescheduleAppointment
  };
}); 