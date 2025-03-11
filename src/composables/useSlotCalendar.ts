/**
 * Slot Calendar Composable
 * 
 * Manages the logic for displaying and interacting with the calendar of available slots.
 */
import { ref, computed } from 'vue';
import type { Slot } from '@/types/Slot';
import { 
  getNextSevenDays,
  getMondayOfWeek
} from '@/utils/dateUtils';

export function useSlotCalendar() {
  const currentWeekStartDate = ref(getMondayOfWeek(new Date()));
  const showAllSlots = ref(false);
  const selectedSlot = ref<Slot | null>(null);

  const currentWeekDates = computed(() => {
    return getNextSevenDays(currentWeekStartDate.value);
  });

  const goToNextWeek = (): Date => {
    const newDate = new Date(currentWeekStartDate.value);
    newDate.setDate(newDate.getDate() + 7);
    currentWeekStartDate.value = newDate;
    return newDate;
  }
  
  const goToPreviousWeek = (): Date | null => {
    const todayDate = new Date();
    const mondayOfToday = getMondayOfWeek(todayDate);
    
    const newDate = new Date(currentWeekStartDate.value);
    newDate.setDate(newDate.getDate() - 7);
    
    // Allow going back one week from the current week, even if that previous week contains today
    // But don't allow going beyond today's week (earlier than one week before today's Monday)
    const oneWeekBeforeTodaysMonday = new Date(mondayOfToday);
    oneWeekBeforeTodaysMonday.setDate(oneWeekBeforeTodaysMonday.getDate() - 7);
    
    if (newDate >= oneWeekBeforeTodaysMonday) {
      currentWeekStartDate.value = newDate;
      return newDate;
    }
    
    return null;
  }

  const toggleShowAllSlots = (): void => {
    showAllSlots.value = !showAllSlots.value;
  }

  const handleSlotSelect = (slot: Slot): void => {
    selectedSlot.value = slot;
    showAllSlots.value = false;
  }

  const clearSelectedSlot = (): void => {
    selectedSlot.value = null;
  }

  return {
    // State
    currentWeekStartDate,
    showAllSlots,
    selectedSlot,
    
    // Computed
    currentWeekDates,
    
    // Methods
    goToNextWeek,
    goToPreviousWeek,
    toggleShowAllSlots,
    handleSlotSelect,
    clearSelectedSlot
  };
}