<script setup lang="ts">
import AppointmentRescheduler from './components/AppointmentRescheduler.vue'
</script>

<template>
  <v-app>
    <v-main>
        <v-container>
          <AppointmentRescheduler />
        </v-container>
    </v-main>
  </v-app>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, sans-serif;
  color: var(--text-color);
}
</style>
