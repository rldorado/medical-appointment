<template>
  <v-card variant="elevated" class="bg-white mb-20">
    <v-card-text class="text-body-1">
      <v-icon icon="mdi-calendar-text" class="mr-2"></v-icon>
      On {{ appointmentDate }}
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{
  doctor: string;
  appointmentDate: string;
}>();
</script>

