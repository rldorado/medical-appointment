<template>
  <v-card variant="flat" class="bg-transparent ma-4">
    <v-card-title class="text-h6 d-flex align-center">
      Confirm your appointment with&nbsp;<strong>{{ appointmentStore.currentAppointment.doctor }}</strong>
    </v-card-title>

    <v-card-text>
      <v-alert v-if="errorMessage" type="error" class="mb-4" closable @click:close="clearError">
        {{ errorMessage }}
      </v-alert>

      <v-progress-linear
        v-if="isLoading"
        indeterminate
        color="primary"
        class="mb-4"
      ></v-progress-linear>

      <AppointmentInfo :appointment-date="appointmentStore.currentAppointment.formattedDate" />

      <div v-if="appointmentStore.isReschedulingSpinner" class="d-flex flex-column align-center my-4">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
        <div class="mt-4 text-body-1">
          <span class="text-decoration-line-through">{{ appointmentStore.currentAppointment.formattedDate }}</span>
        </div>
      </div>

      <div class="mt-8">
        <div class="text-h6 d-flex flex-column my-8">
          <p class="font-weight-bold">Did you have an unexpected situation?</p>
          <p>You can change the appointment for when it suits you better</p>
        </div>
        <SlotCalendar
          :weekly-slots="weeklySlots"
          :is-loading="isLoading"
          @select-slot="handleSlotSelect"
          @week-change="handleWeekChange"
        />
      </div>

      <div v-if="selectedSlot" class="bg-white mt-8">
        <v-card variant="flat" class="mb-4 pa-4">
          <v-card-title class="text-h6">Reschedule</v-card-title>
          <v-card-text>
            <p class="text-body-1 mb-10">
              Click the button below to confirm
            </p>
            <v-btn
              color="primary"
              block
              @click="confirmReschedule"
              :loading="appointmentStore.isRescheduling"
              :disabled="appointmentStore.isRescheduling"
            >
              {{ formatDateForDisplay(selectedSlot.start) }} at {{ formatTimeForDisplay(selectedSlot.start) }}
            </v-btn>
          </v-card-text>
        </v-card>
      </div>

    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
/**
 * AppointmentRescheduler Component
 * 
 * Main component for the appointment rescheduling feature.
 * Allows users to view their current appointment and reschedule it.
 */
import { ref, onMounted } from 'vue';
import { formatDateForApi, formatDateForDisplay, formatTimeForDisplay } from '@/utils/dateUtils';
import SlotCalendar from './SlotCalendar.vue';
import AppointmentInfo from './AppointmentInfo.vue';
import { useAppointmentStore } from '@/stores/appointmentStore';
import type { Slot, WeeklySlots } from '@/types/Slot';
import { getWeeklySlots } from '@/services/appointmentService';

const appointmentStore = useAppointmentStore();

// Local state
const weeklySlots = ref<WeeklySlots[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');
const selectedSlot = ref<Slot | null>(null);

const clearError = () => {
  errorMessage.value = '';
  appointmentStore.clearError();
}

// Handle slot selection
const handleSlotSelect = (slot: Slot) => {
  selectedSlot.value = slot;
  clearError();
}

// Handle week change from calendar
const handleWeekChange = async (date: Date) => {
  await loadSlotsForDate(date);
}

// Load slots for a specific date
const loadSlotsForDate = async (date: Date) => {
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    const apiDate = formatDateForApi(date);
    weeklySlots.value = await getWeeklySlots(apiDate);
  } catch (error) {
    console.error('Failed to load slots:', error);
    errorMessage.value = 'Failed to load available slots. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

// Confirm and process the reschedule
const confirmReschedule = async () => {
  if (!selectedSlot.value) return;
  
  try {
    const success = await appointmentStore.rescheduleAppointment(selectedSlot.value);
    
    if (success) {
      // Clear selected slot after successful reschedule
      selectedSlot.value = null;
    } else {
      errorMessage.value = appointmentStore.errorMessage;
    }
  } catch (error) {
    console.error('Error in confirmReschedule:', error);
    errorMessage.value = 'An unexpected error occurred. Please try again.';
  }
}

// Initialize component
onMounted(async () => {

  const today = new Date();  // Load initial slots for current date
  await loadSlotsForDate(today);
});
</script>
