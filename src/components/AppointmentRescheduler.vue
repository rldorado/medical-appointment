<template>
  <v-card variant="flat" class="bg-transparent ma-4">
    <v-card-title class="text-h5 d-flex align-center">
      Confirm your appointment with <strong>{{ currentAppointment.doctor }}</strong>
    </v-card-title>

    <v-card-text>
      <v-alert v-if="errorMessage" type="error" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <v-progress-linear
        v-if="isLoading"
        indeterminate
        color="primary"
        class="mb-4"
      ></v-progress-linear>

      <AppointmentInfo 
        :doctor="currentAppointment.doctor" 
        :appointment-date="currentAppointment.formattedDate" 
      />

      <div v-if="isReschedulingSpinner" class="d-flex flex-column align-center my-4">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
        <div class="mt-4 text-body-1">
          <span class="text-decoration-line-through">{{ currentAppointment.formattedDate }}</span>
        </div>
      </div>

      <div v-else class="mt-8">
        <div class="text-h5 d-flex flex-column my-4">
          <p class="font-weight-bold">Did you have an unexpected situation?</p>
          <p>You can change the appointment for when it suits you better</p>
        </div>
        <SlotCalendar
          :weekly-slots="weeklySlots"
          :current-week-dates="currentWeekDates"
          :is-loading="isLoading"
          @previous-week="goToPreviousWeek"
          @next-week="goToNextWeek"
          @select-slot="handleSlotSelect"
        />
      </div>

    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getWeeklySlots, bookSlot } from '@/services/appointmentService';
import type { WeeklySlots } from '@/types/Slot';
import type { BookingRequest } from '@/types/Booking';
import {
  formatDateForApi,
  formatDateForDisplay,
  formatTimeForDisplay,
  getNextSevenDays
} from '@/utils/dateUtils';
import SlotCalendar from './SlotCalendar.vue';
import AppointmentInfo from './AppointmentInfo.vue';
import { CURRENT_APPOINTMENT, CURRENT_PATIENT } from '@/config/mockData';

// INFO: Current appointment data (initial data as per requirements)
const currentAppointment = ref(CURRENT_APPOINTMENT);

const isReschedulingSpinner = ref(false);
const today = new Date();

// Set current week start date to the Monday of the current week
const mondayOfCurrentWeek = new Date(today);
const dayOfWeek = today.getDay();
const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday (0), then it's 6 days from Monday, otherwise day - 1
mondayOfCurrentWeek.setDate(today.getDate() - diff);

const weeklySlots = ref<WeeklySlots[]>([]);
const isLoading = ref(false);
const isRescheduling = ref(false);
const currentWeekStartDate = ref(mondayOfCurrentWeek);
const errorMessage = ref('');

const currentWeekDates = computed(() => {
  return getNextSevenDays(currentWeekStartDate.value);
});

const loadWeeklySlots = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    const apiDate = formatDateForApi(currentWeekDates.value[0]);
    console.log('Formatted date for API:', apiDate);
    
    weeklySlots.value = await getWeeklySlots(apiDate);
  } catch (error) {
    console.error('Failed to load slots:', error);
    errorMessage.value = 'Failed to load available slots. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const goToNextWeek = () => {
  const newDate = new Date(currentWeekStartDate.value);
  newDate.setDate(newDate.getDate() + 7);
  currentWeekStartDate.value = newDate;
  loadWeeklySlots();
};

const goToPreviousWeek = () => {
  const todayDate = new Date();
  const mondayOfToday = new Date(todayDate);
  const dayOfWeek = todayDate.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  mondayOfToday.setDate(todayDate.getDate() - diff);
  
  const newDate = new Date(currentWeekStartDate.value);
  newDate.setDate(newDate.getDate() - 7);
  
  // Don't allow going to past weeks (before the current week's Monday)
  if (newDate >= mondayOfToday) {
    currentWeekStartDate.value = newDate;
    loadWeeklySlots();
  }
};

const handleSlotSelect = async (slot: { start: string; end: string }) => {
  isRescheduling.value = true;
  isReschedulingSpinner.value = true;
  errorMessage.value = '';
  
  try {
    const bookingData: BookingRequest = {
      Start: slot.start,
      End: slot.end,
      Comments: '',
      Patient: CURRENT_PATIENT // Mock data
    };
    
    // Simulate API delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await bookSlot(bookingData);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to reschedule appointment');
    }
    
    // Update current appointment with the new date
    const newDate = new Date(slot.start);
    currentAppointment.value = {
      ...currentAppointment.value,
      date: newDate,
      formattedDate: `${formatDateForDisplay(slot.start)} at ${formatTimeForDisplay(slot.start)}`
    };
    
  } catch (error) {
    console.error('Failed to reschedule appointment:', error);
    errorMessage.value = error instanceof Error 
      ? error.message 
      : 'Failed to reschedule appointment. Please try again.';
  } finally {
    isRescheduling.value = false;
    isReschedulingSpinner.value = false;
  }
};

onMounted(() => {
  loadWeeklySlots();
});
</script>
