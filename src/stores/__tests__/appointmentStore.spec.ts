import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppointmentStore } from '../appointmentStore'
import { bookSlot } from '@/services/appointmentService'
import { CURRENT_APPOINTMENT, CURRENT_PATIENT } from '@/config/mockData'

vi.mock('@/services/appointmentService', () => ({
  bookSlot: vi.fn()
}))

describe('appointmentStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })
  
  it('initializes with correct default values', () => {
    const store = useAppointmentStore()
    
    expect(store.currentAppointment).toEqual(CURRENT_APPOINTMENT)
    expect(store.isRescheduling).toBe(false)
    expect(store.isReschedulingSpinner).toBe(false)
    expect(store.errorMessage).toBe('')
  })
  
  it('clears error message', () => {
    const store = useAppointmentStore()
    
    // Set an error message
    store.errorMessage = 'Test error'
    
    // Clear the error
    store.clearError()
    
    expect(store.errorMessage).toBe('')
  })
  
  it('successfully reschedules an appointment', async () => {
    const store = useAppointmentStore()
    const testSlot = { start: '2025-03-10T10:00:00', end: '2025-03-10T10:30:00' }
    
    // Mock successful API response
    vi.mocked(bookSlot).mockResolvedValue({
      success: true,
      message: 'Appointment rescheduled successfully'
    })
    
    // Save the initial appointment date for comparison
    const initialDate = store.currentAppointment.date
    const initialFormattedDate = store.currentAppointment.formattedDate
    
    // Call the reschedule method
    const result = await store.rescheduleAppointment(testSlot)
    
    // Verify the result and state changes
    expect(result).toBe(true)
    expect(store.isRescheduling).toBe(false)
    expect(store.isReschedulingSpinner).toBe(false)
    expect(store.errorMessage).toBe('')
    
    // Verify the API was called with correct data
    expect(bookSlot).toHaveBeenCalledWith({
      Start: testSlot.start,
      End: testSlot.end,
      Comments: '',
      Patient: CURRENT_PATIENT
    })
    
    // Verify the appointment was updated by checking observable changes
    expect(store.currentAppointment.date).not.toEqual(initialDate)
    expect(store.currentAppointment.formattedDate).not.toEqual(initialFormattedDate)
    expect(store.currentAppointment.formattedDate).toContain('at')
  })
  
  it('handles appointment rescheduling failure', async () => {
    const store = useAppointmentStore()
    const testSlot = { start: '2025-03-10T10:00:00', end: '2025-03-10T10:30:00' }
    const errorMessage = 'Failed to reschedule appointment'
    
    // Mock failed API response
    vi.mocked(bookSlot).mockResolvedValue({
      success: false,
      message: errorMessage
    })
    
    // Call the reschedule method
    const result = await store.rescheduleAppointment(testSlot)
    
    // Verify the result and state changes
    expect(result).toBe(false)
    expect(store.isRescheduling).toBe(false)
    expect(store.isReschedulingSpinner).toBe(false)
    expect(store.errorMessage).toBe(errorMessage)
  })
  
  it('handles API exceptions during rescheduling', async () => {
    const store = useAppointmentStore()
    const testSlot = { start: '2025-03-10T10:00:00', end: '2025-03-10T10:30:00' }
    const errorMessage = 'Network error'
    
    // Mock API exception
    vi.mocked(bookSlot).mockRejectedValue(new Error(errorMessage))
    
    // Call the reschedule method
    const result = await store.rescheduleAppointment(testSlot)
    
    // Verify the result and state changes
    expect(result).toBe(false)
    expect(store.isRescheduling).toBe(false)
    expect(store.isReschedulingSpinner).toBe(false)
    expect(store.errorMessage).toBe(errorMessage)
  })
  
  it('does nothing if no slot is provided', async () => {
    const store = useAppointmentStore()
    
    // Call the reschedule method with no slot
    const result = await store.rescheduleAppointment(null as any)
    
    // Verify the API was not called
    expect(bookSlot).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
  
  it('updates appointment with new slot data', async () => {
    const store = useAppointmentStore()
    const testSlot = { start: '2025-03-10T10:00:00', end: '2025-03-10T10:30:00' }
    
    // Mock successful API response
    vi.mocked(bookSlot).mockResolvedValue({
      success: true,
      message: 'Appointment updated successfully'
    })
    
    // Save the initial appointment state
    const initialDate = store.currentAppointment.date
    const initialFormattedDate = store.currentAppointment.formattedDate
    
    // Call the public method that internally uses updateAppointment
    await store.rescheduleAppointment(testSlot)
    
    // Verify the appointment was updated by checking observable changes
    expect(store.currentAppointment.date).not.toEqual(initialDate)
    expect(store.currentAppointment.date).toBeInstanceOf(Date)
    expect(store.currentAppointment.formattedDate).not.toEqual(initialFormattedDate)
    expect(store.currentAppointment.formattedDate).toContain('at')
  })
})
