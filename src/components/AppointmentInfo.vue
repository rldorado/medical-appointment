<template>
  <v-card variant="elevated" class="bg-white mb-6">
    <v-card-text class="text-body-1 py-4">
      <div class="d-flex align-center">
        <v-icon icon="mdi-calendar-text" class="mr-2"></v-icon>
        <span>On <strong>{{ appointmentDate }}</strong></span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
/**
 * AppointmentInfo Component
 * 
 * Displays the current appointment information.
 * 
 * @prop {string} appointmentDate - The formatted date and time of the appointment
 */
defineProps<{ 
  appointmentDate: string 
}>();
</script>

