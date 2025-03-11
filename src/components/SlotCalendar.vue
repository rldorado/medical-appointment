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
      <div class="week-container position-relative w-100">
        <transition
          name="week-transition"
          mode="out-in"
          @before-enter="startTransition"
          @after-leave="endTransition"
        >
          <div :key="'week-' + getWeekKey()" class="d-flex flex-wrap w-100">
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
                      <transition-group
                        name="slot-transition"
                        tag="div"
                        class="slot-list-container"
                      >
                        <v-list-item
                          v-for="(slot, index) in getVisibleSlotsForDate(date)"
                          :key="slot.start"
                          :disabled="!slot.available"
                          :ripple="slot.available"
                          class="mb-2 rounded slot-item"
                          :class="{'selected-slot': isSelectedSlot(slot)}"
                          :style="{ transitionDelay: `${index * 50}ms` }"
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
          </div>
        </transition>
        
        <v-col v-if="!hasWeekDates" cols="12">
          <v-alert type="info" class="mt-4">
            No available slots for this week. Please try another week.
          </v-alert>
        </v-col>
      </div>
    </v-row>
    
    <!-- "See more hours" button -->
    <div v-if="hasAnySlotsWithMoreThanThree" class="d-flex justify-center mt-4">
      <v-btn
        variant="outlined"
        color="primary"
        block
        @click="toggleShowMoreHours"
        class="more-hours-btn"
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
const isLoadingTransition = ref(false);
const transitionDirection = ref('next'); // 'next' or 'prev'

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

const getVisibleSlotsForDate = (date: Date) => {
  const slots = getSlotsForDate(date);
  
  if (calendar.showAllSlots.value) {
    return slots;
  } else {
    // Keep the selection visible
    if (calendar.selectedSlot.value) {
      const selectedSlotDate = new Date(calendar.selectedSlot.value.start);
      const dateStr = date.toISOString().split('T')[0];
      const selectedSlotDateStr = selectedSlotDate.toISOString().split('T')[0];
      
      // If the selected slot is on this date
      if (dateStr === selectedSlotDateStr) {
        // Check if the selected slot is in the first 3 slots
        const firstThreeSlots = slots.slice(0, 3);
        const selectedSlotInFirstThree = firstThreeSlots.some(
          slot => slot.start === calendar.selectedSlot.value?.start
        );
        
        // If not in first three, add it to the visible slots
        if (!selectedSlotInFirstThree && slots.length > 3) {
          const selectedSlotInAll = slots.find(
            slot => slot.start === calendar.selectedSlot.value?.start
          );
          
          if (selectedSlotInAll) {
            return [...firstThreeSlots, selectedSlotInAll];
          }
        }
      }
    }
    
    return slots.slice(0, 3);
  }
}

// Unique key for each date to help Vue track the elements
const getDateKey = (date: Date) => {
  return `date-${date.toISOString().slice(0, 10)}`;
}

const isSelectedSlot = (slot: Slot): boolean => {
  return calendar.selectedSlot.value?.start === slot.start;
}

const onSlotSelect = (slot: Slot) => {
  const slotTime = new Date(slot.start);
  const now = new Date();
  
  // Don't allow booking slots in the past
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
  if (isLoadingTransition.value) return;
  transitionDirection.value = 'next';
  const newDate = calendar.goToNextWeek();
  emit('week-change', newDate);
}

const handlePreviousWeek = (): void => {
  if (isLoadingTransition.value) return;
  transitionDirection.value = 'prev';
  const newDate = calendar.goToPreviousWeek();
  if (newDate) {
    emit('week-change', newDate);
  }
}

const toggleShowMoreHours = (): void => {
  calendar.toggleShowAllSlots();
}

// Generate a week key for transition animations
const getWeekKey = () => {
  const firstDate = calendar.currentWeekDates.value[0];
  return firstDate ? firstDate.toISOString().slice(0, 10) : 'no-dates';
};

// Transition management
const startTransition = () => {
  isLoadingTransition.value = true;
};

const endTransition = () => {
  isLoadingTransition.value = false;
};
</script>

<style scoped>
.border-primary {
  border: 2px solid rgb(var(--v-theme-primary));
}

.week-container {
  overflow: hidden;
  min-height: 200px;
}

/* Week transition animations */
.week-transition-enter-active,
.week-transition-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
}

.week-transition-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.week-transition-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}

/* Improved accessibility focus styles */
:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

/* Slot transition animations */
.slot-transition-move,
.slot-transition-enter-active,
.slot-transition-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
  backface-visibility: hidden;
}

.slot-transition-enter-from,
.slot-transition-leave-to {
  opacity: 0;
  transform: translateY(15px);
}

.slot-transition-move {
  transition-delay: 0.05s;
}

.slot-list-container {
  min-height: 40px;
  position: relative;
  overflow: hidden;
}

/* Button animation with improved accessibility */
.more-hours-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.more-hours-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.more-hours-btn:focus-visible {
  box-shadow: 0 0 0 2px rgb(var(--v-theme-primary));
}

/* Improved slot item styles for better accessibility */
.slot-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, box-shadow, background-color;
}

.slot-item:not(.v-list-item--disabled):hover {
  background-color: rgb(var(--v-theme-primary), 0.12);
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.slot-item:focus-visible {
  box-shadow: 0 0 0 2px rgb(var(--v-theme-primary));
}

.selected-slot {
  background-color: rgb(var(--v-theme-primary), 0.18);
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

/* Collapse transition for the See more/less hours button */
.collapse-transition-enter-active {
  transition: all 0.8s cubic-bezier(0.25, 1, 0.5, 1); /* Slower for entering */
  max-height: 30px;
  overflow: hidden;
}

.collapse-transition-leave-active {
  transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1); /* Slightly faster for leaving */
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
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.expanded {
  background-color: rgba(var(--v-theme-primary), 0.15);
  transform: scale(1.05);
}

.collapsed {
  background-color: rgba(var(--v-theme-secondary), 0.08);
}
</style>
