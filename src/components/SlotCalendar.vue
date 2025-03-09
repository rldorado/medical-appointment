<template>
  <div class="mt-2 pa-4 bg-white">
    <!-- Time format switch -->
    <div class="d-flex align-center justify-end">
      <span class="text-body-2 mr-2">12h</span>
      <v-switch
        v-model="use24HourFormat"
        color="primary"
        hide-details
        density="compact"
        class="ma-0 pa-0"
      ></v-switch>
      <span class="text-body-2 ml-2">24h</span>
    </div>

    <!-- Calendar header with navigation -->
    <div class="d-flex justify-space-between align-center mb-4">
      <v-btn
        icon="mdi-chevron-left"
        variant="text"
        @click="handlePreviousWeek"
        class="mr-2"
      />
      <v-btn
        icon="mdi-chevron-right"
        variant="text"
        @click="handleNextWeek"
        class="ml-2"
      />
    </div>
    
    <!-- Calendar days -->
    <v-row class="mt-2">
      <transition-group name="fade-transition" tag="div" class="d-flex flex-wrap w-100">
        <v-col
          v-for="date in calendar.currentWeekDates.value" 
          :key="getDateKey(date)" 
          cols="12" sm="6" md="4" lg="3"
        >
          <v-card
            variant="flat"
            :class="{ 'border-primary': isToday(date) }"
            class="h-100"
          >
          <v-card-title class="text-subtitle-1 text-center py-2 px-4 bg-grey-lighten-4">
            {{ formatCalendarDateLabel(date) }}
          </v-card-title>
          
          <v-card-text class="px-2 py-2">
            <v-skeleton-loader
              v-if="props.isLoading"
              type="list-item-three-line"
            ></v-skeleton-loader>
            
            <template v-else-if="hasSlots(date)">
              <v-list lines="one" class="pa-0">
                <transition-group name="slot-transition" tag="div">
                  <v-list-item
                    v-for="slot in getVisibleSlotsForDate(date)"
                    :key="slot.start"
                    :disabled="!slot.available"
                    :ripple="slot.available"
                    class="mb-2 rounded slot-item"
                    :class="{'selected-slot': isSelectedSlot(slot)}"
                    @click="slot.available && onSlotSelect(slot)"
                  >
                    <v-list-item-title
                      :class="{ 'text-decoration-line-through': !slot.available }"
                      class="d-flex justify-space-between align-center"
                    >
                      {{ formatTimeByPreference(slot.start, use24HourFormat) }}
                    </v-list-item-title>
                  </v-list-item>
                </transition-group>
              </v-list>
            </template>
            
            <div v-else-if="!props.isLoading" class="text-center py-4 text-grey">
              No available slots
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      </transition-group>
      
      <v-col v-if="!hasWeekDates" cols="12">
        <v-alert type="info" class="mt-4">
          No available slots for this week. Please try another week.
        </v-alert>
      </v-col>
    </v-row>
    
    <!-- "See more hours" button -->
    <div v-if="hasAnySlotsWithMoreThanThree" class="d-flex justify-center mt-4">
      <v-btn
        variant="outlined"
        color="primary"
        block
        @click="toggleShowMoreHours"
      >
        {{ calendar.showAllSlots.value ? 'See less hours' : 'See more hours' }}
      </v-btn>
    </div>
    
    <!-- Animated slots container for each date -->
    <div class="slot-animation-container">
      <transition name="collapse-transition" mode="out-in">
        <div v-if="calendar.showAllSlots.value" key="expanded" class="slot-indicator expanded">
          <span class="text-caption text-grey">Showing all available time slots</span>
        </div>
        <div v-else key="collapsed" class="slot-indicator collapsed">
          <span class="text-caption text-grey">Showing limited time slots</span>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SlotCalendar Component
 * 
 * Displays a calendar with available appointment slots.
 * Allows users to navigate between weeks and select a slot.
 */
import { computed, ref } from 'vue'
import { useSlotCalendar } from '@/composables/useSlotCalendar'
import type { Slot, WeeklySlots } from '@/types/Slot'
import {
  formatDateToYYYYMMDD,
  formatTimeByPreference,
  formatCalendarDateLabel,
  isToday
} from '@/utils/dateUtils'

const calendar = useSlotCalendar();

const use24HourFormat = ref(false);

const props = defineProps<{
  weeklySlots: WeeklySlots[];
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'select-slot', slot: Slot): void;
  (e: 'week-change', date: Date): void;
}>();

const hasWeekDates = computed<boolean>(() => 
  calendar.currentWeekDates.value.length > 0
);

const hasAnySlotsWithMoreThanThree = computed<boolean>(() => {
  return calendar.currentWeekDates.value.some((date: Date) => getSlotsForDate(date).length > 3);
});

const hasSlots = (date: Date) => {
  return getSlotsForDate(date).length > 0;
}

const getSlotsForDate = (date: Date) => {
  if (!props.weeklySlots || props.weeklySlots.length === 0) {
    return [];
  }

  const dateStr = formatDateToYYYYMMDD(date);
  
  // Find slots for this date with proper null checks
  const daySlots = props.weeklySlots.find(day => day && day.date && day.date.startsWith(dateStr));
  return daySlots?.slots || [];
}

// Get only the slots that should be visible based on showAllSlots
const getVisibleSlotsForDate = (date: Date): Slot[] => {
  const slots = getSlotsForDate(date);
  return calendar.showAllSlots.value ? slots : slots.slice(0, 3);
}

// Generate a unique key for each date to help Vue track the elements
const getDateKey = (date: Date) => {
  return `date-${date.toISOString().slice(0, 10)}`;
}

// Check if a slot is currently selected
const isSelectedSlot = (slot: Slot): boolean => {
  return calendar.selectedSlot.value?.start === slot.start;
}

const onSlotSelect = (slot: Slot) => {
  // Don't allow booking slots in the past
  const slotTime = new Date(slot.start);
  const now = new Date();
  
  if (slotTime <= now) {
    // Show feedback to the user using alert (simpler than adding a toast library)
    alert("Cannot select a past time slot. Please choose a future time.");
    calendar.clearSelectedSlot();
    return;
  }
  
  calendar.handleSlotSelect(slot);
  emit('select-slot', slot);
}

const handleNextWeek = (): void => {
  const newDate = calendar.goToNextWeek();
  emit('week-change', newDate);
}

const handlePreviousWeek = (): void => {
  const newDate = calendar.goToPreviousWeek();
  if (newDate) {
    emit('week-change', newDate);
  }
}

// Toggle show all slots with animation
const toggleShowMoreHours = (): void => {
  calendar.toggleShowAllSlots();
}
</script>

<style scoped>
.border-primary {
  border: 2px solid rgb(var(--v-theme-primary));
}

/* Fade transition animations for week changes */
.fade-transition-move,
.fade-transition-enter-active,
.fade-transition-leave-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-transition-enter-from,
.fade-transition-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-transition-leave-active {
  position: absolute;
}

/* Collapse transition for the See more/less hours button */
.collapse-transition-enter-active,
.collapse-transition-leave-active {
  transition: all 0.3s ease;
  max-height: 30px;
  overflow: hidden;
}

.collapse-transition-enter-from,
.collapse-transition-leave-to {
  opacity: 0;
  max-height: 0;
}

.slot-animation-container {
  height: 24px;
  overflow: hidden;
  margin-top: 8px;
  display: flex;
  justify-content: center;
}

.slot-indicator {
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.expanded {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.collapsed {
  background-color: rgba(var(--v-theme-secondary), 0.05);
}

/* Slot transition animations */
.slot-transition-move,
.slot-transition-enter-active,
.slot-transition-leave-active {
  transition: all 0.3s ease;
}

.slot-transition-enter-from,
.slot-transition-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.slot-item {
  transition: all 0.3s ease;
}

.slot-item:not(.v-list-item--disabled):hover {
  background-color: rgb(var(--v-theme-primary), 0.1);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.selected-slot {
  background-color: rgb(var(--v-theme-primary), 0.15) !important;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
