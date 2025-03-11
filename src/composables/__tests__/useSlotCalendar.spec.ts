import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useSlotCalendar } from '../useSlotCalendar'
import type { Slot } from '@/types/Slot'

// Mock the dateUtils module
vi.mock('@/utils/dateUtils', () => {
  return {
    getNextSevenDays: vi.fn((date) => {
      // Return 7 days starting from the given date
      const days = []
      const startDate = new Date(date)
      for (let i = 0; i < 7; i++) {
        const day = new Date(startDate)
        day.setDate(day.getDate() + i)
        days.push(day)
      }
      return days
    }),
    getMondayOfWeek: vi.fn(() => {
      // For simplicity, in our tests, we'll say Monday is 2025-03-10
      return new Date('2025-03-10')
    })
  }
})

// Import the mocked functions after mocking
import { getNextSevenDays, getMondayOfWeek } from '@/utils/dateUtils'

describe('useSlotCalendar', () => {
  let calendar: ReturnType<typeof useSlotCalendar>
  
  // Fixed date for testing
  const fixedDate = new Date('2025-03-10T12:00:00')
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Mock Date.now() to return a fixed timestamp
    vi.spyOn(Date, 'now').mockImplementation(() => fixedDate.getTime())
    
    // Initialize the calendar for each test
    calendar = useSlotCalendar()
  })
  
  afterEach(() => {
    // Restore all mocks
    vi.restoreAllMocks()
  })
  
  it('initializes with correct default values', () => {
    expect(calendar.currentWeekStartDate.value).toEqual(getMondayOfWeek(new Date()))
    expect(calendar.showAllSlots.value).toBe(false)
    expect(calendar.selectedSlot.value).toBeNull()
    
    // Verify that getMondayOfWeek was called
    expect(getMondayOfWeek).toHaveBeenCalled()
  })
  
  it('computes current week dates correctly', () => {
    const weekDates = calendar.currentWeekDates.value
    expect(weekDates.length).toBe(7)
    
    // Verify that getNextSevenDays was called with the current week start date
    expect(getNextSevenDays).toHaveBeenCalledWith(calendar.currentWeekStartDate.value)
    
    // First date should be Monday (2025-03-10)
    expect(weekDates[0].toISOString().split('T')[0]).toBe('2025-03-10')
    
    // Last date should be Sunday (2025-03-16)
    expect(weekDates[6].toISOString().split('T')[0]).toBe('2025-03-16')
  })
  
  it('navigates to next week correctly', () => {
    const initialDate = new Date(calendar.currentWeekStartDate.value)
    const newDate = calendar.goToNextWeek()
    
    // New date should be 7 days later
    const expectedDate = new Date(initialDate)
    expectedDate.setDate(expectedDate.getDate() + 7)
    
    expect(newDate.getTime()).toBe(expectedDate.getTime())
    expect(calendar.currentWeekStartDate.value.getTime()).toBe(expectedDate.getTime())
  })
  
  it('navigates to previous week correctly when allowed', () => {
    // First go to next week to ensure we can go back
    calendar.goToNextWeek()
    const initialDate = new Date(calendar.currentWeekStartDate.value)
    
    const newDate = calendar.goToPreviousWeek()
    
    // New date should be 7 days earlier
    const expectedDate = new Date(initialDate)
    expectedDate.setDate(expectedDate.getDate() - 7)
    
    expect(newDate).not.toBeNull()
    expect(newDate?.getTime()).toBe(expectedDate.getTime())
    expect(calendar.currentWeekStartDate.value.getTime()).toBe(expectedDate.getTime())
  })
  
  it('prevents navigating to previous week if it would be before allowed limit', () => {
    // Mock the date functions to simulate being at the earliest allowed week
    const oneWeekBeforeTodaysMonday = new Date('2025-03-03') // One week before our fixed Monday
    
    // Mock getMondayOfWeek to return a date that would make the current week the earliest allowed
    vi.mocked(getMondayOfWeek).mockReturnValueOnce(new Date('2025-03-10'))
    
    // Reset the calendar with our new mocks
    calendar = useSlotCalendar()
    
    // Set the current week to the earliest allowed week
    calendar.currentWeekStartDate.value = new Date('2025-03-03')
    
    // Try to go to previous week
    const result = calendar.goToPreviousWeek()
    
    // Should return null and not change the date
    expect(result).toBeNull()
    expect(calendar.currentWeekStartDate.value.toISOString().split('T')[0]).toBe('2025-03-03')
  })
  
  it('toggles showAllSlots correctly', () => {
    expect(calendar.showAllSlots.value).toBe(false)
    
    calendar.toggleShowAllSlots()
    expect(calendar.showAllSlots.value).toBe(true)
    
    calendar.toggleShowAllSlots()
    expect(calendar.showAllSlots.value).toBe(false)
  })
  
  it('handles slot selection correctly', () => {
    const testSlot: Slot = { 
      start: '2025-03-10T10:00:00', 
      end: '2025-03-10T10:30:00', 
      available: true 
    }
    
    // Initially, showAllSlots should be false and selectedSlot should be null
    expect(calendar.showAllSlots.value).toBe(false)
    expect(calendar.selectedSlot.value).toBeNull()
    
    // Select a slot
    calendar.handleSlotSelect(testSlot)
    
    // After selection, selectedSlot should be set and showAllSlots should remain false
    expect(calendar.selectedSlot.value).toEqual(testSlot)
    expect(calendar.showAllSlots.value).toBe(false)
    
    // Set showAllSlots to true
    calendar.showAllSlots.value = true
    
    // Select another slot
    const anotherSlot: Slot = { 
      start: '2025-03-10T11:00:00', 
      end: '2025-03-10T11:30:00', 
      available: true 
    }
    calendar.handleSlotSelect(anotherSlot)
    
    // After selection, selectedSlot should be updated and showAllSlots should be set to false
    expect(calendar.selectedSlot.value).toEqual(anotherSlot)
    expect(calendar.showAllSlots.value).toBe(false)
    
    // Clear the selected slot
    calendar.clearSelectedSlot()
    
    // After clearing, selectedSlot should be null
    expect(calendar.selectedSlot.value).toBeNull()
  })
  
  it('handles edge cases in date navigation', () => {
    // Test navigating multiple weeks forward
    const initialDate = new Date(calendar.currentWeekStartDate.value)
    
    // Navigate 4 weeks forward
    let currentDate = initialDate
    for (let i = 0; i < 4; i++) {
      const newDate = calendar.goToNextWeek()
      currentDate = new Date(currentDate)
      currentDate.setDate(currentDate.getDate() + 7)
      
      expect(newDate.getTime()).toBe(currentDate.getTime())
    }
    
    // Navigate back to the original week
    for (let i = 0; i < 4; i++) {
      const newDate = calendar.goToPreviousWeek()
      currentDate = new Date(currentDate)
      currentDate.setDate(currentDate.getDate() - 7)
      
      expect(newDate?.getTime()).toBe(currentDate.getTime())
    }
  })
})
