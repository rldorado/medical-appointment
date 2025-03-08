<template>
  <div class="mt-2 pa-4 bg-white">
    <!-- Calendar header with navigation -->
    <div class="calendar-header">
      <v-btn 
        icon="mdi-chevron-left" 
        variant="text" 
        @click="goToPreviousWeek"
        class="mr-2"
      ></v-btn>
      <v-btn
        icon="mdi-chevron-right" 
        variant="text" 
        @click="goToNextWeek"
        class="ml-2"
      ></v-btn>
    </div>
    
    <!-- Calendar days -->
    <v-row class="mt-2">
      <v-col
        v-for="date in currentWeekDates" 
        :key="date.toISOString()" 
        cols="12" sm="6" md="4" lg="3"
      >
        <v-card
          variant="flat" 
          :class="{ 'border-primary': isToday(date) }"
          class="calendar-day"
        >
          <v-card-title class="text-subtitle-1 py-2 px-4 bg-grey-lighten-4">
            {{ formatDateForDisplay(date.toISOString()) }}
          </v-card-title>
          
          <v-card-text class="px-2 py-2">
            <v-skeleton-loader
              v-if="isLoading"
              type="list-item-three-line"
            ></v-skeleton-loader>
            
            <template v-else-if="getSlotsForDate(date).length > 0">
              <v-list lines="one" class="pa-0">
                <v-list-item
                  v-for="(slot, index) in getSlotsForDate(date)" 
                  :key="slot.start"
                  v-show="showAllSlots[date.toISOString().split('T')[0]] || index < 3"
                  :disabled="!slot.available"
                  :class="{ 'bg-grey-lighten-3': !slot.available }"
                  class="mb-2 rounded slot-item"
                  @click="slot.available && handleSlotSelect(slot)"
                >
                  <v-list-item-title class="d-flex justify-space-between align-center">
                    {{ formatTimeForDisplay(slot.start) }}
                    <v-chip
                      v-if="!slot.available"
                      size="small"
                      color="grey-lighten-1"
                      class="ml-2"
                    >
                      Taken
                    </v-chip>
                  </v-list-item-title>
                </v-list-item>
              </v-list>
              
              <v-btn
                v-if="getSlotsForDate(date).length > 3"
                variant="text"
                block
                size="small"
                class="mt-2"
                @click="toggleShowAllSlots(date)"
              >
                {{ showAllSlots[date.toISOString().split('T')[0]] ? 'See less' : 'See more hours' }}
              </v-btn>
            </template>
            
            <div v-else class="text-center py-4 text-grey">
              No available slots
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { WeeklySlots } from '@/types/Slot';
import { formatDateForDisplay, formatTimeForDisplay, isToday } from '@/utils/dateUtils';

const props = defineProps<{
  weeklySlots: WeeklySlots[];
  currentWeekDates: Date[];
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'previous-week'): void;
  (e: 'next-week'): void;
  (e: 'select-slot', slot: { start: string; end: string }): void;
}>();

const showAllSlots = ref<{ [key: string]: boolean }>({});

// Computed property to get slots for a specific date
const getSlotsForDate = (date: Date) => {
  if (!props.weeklySlots || props.weeklySlots.length === 0) {
    return [];
  }
  
  // Format date to yyyy-MM-dd for comparison
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  // Find slots for this date with proper null checks
  const daySlots = props.weeklySlots.find(day => day && day.date && day.date.startsWith(dateStr));
  return daySlots?.slots || [];
};

const toggleShowAllSlots = (date: Date) => {
  const dateStr = date.toISOString().split('T')[0];
  showAllSlots.value[dateStr] = !showAllSlots.value[dateStr];
};

const handleSlotSelect = (slot: { start: string; end: string }) => {
  emit('select-slot', slot);
};

const goToPreviousWeek = () => {
  emit('previous-week');
};

const goToNextWeek = () => {
  emit('next-week');
};
</script>

<style scoped>
.slot-calendar {
  margin-top: 20px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.calendar-day {
  height: 100%;
}

.border-primary {
  border: 2px solid rgb(var(--v-theme-primary)) !important;
}

.slot-item {
  transition: background-color 0.2s ease;
}

.slot-item:not(.bg-grey-lighten-3):hover {
  background-color: rgb(var(--v-theme-primary), 0.1);
}
</style>
